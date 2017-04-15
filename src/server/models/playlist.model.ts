import * as path from 'path';
import * as fs from 'fs';
import {Stats} from 'fs';
import routes from '../routes';
import {IModel} from "./model";
import {Playlist} from "../entities/playlist";
import {IMediumModel, MediumModel} from "./medium.model";
import {UpsertPlaylistRequest} from '../requests/updatePlaylist.request';
import {IMediaRepository} from '../repositories/media.repository';
import {Link} from '../entities/link';
import {Metadata} from '../entities/metadata';
import {nfcall} from '../utils/promiseHelpers';
import {IPlaylistRepository} from '../repositories/playlist.repository';
import {IUserModel} from './user.model';
// TODO Should instead represent all available playlist services, not one
import {IPlaylistService} from '../services/m3uPlaylist.service';
import {IMediaService} from '../services/media.service';
import {isNullOrUndefined} from 'util';
import {IFileExplorerService} from '../services/fileExplorers/fileExplorer.service';
import {ObjectID} from 'mongodb';
import LazyModelAsync from '../utils/lazyAsync';


export interface IPlaylistModel extends IModel<Playlist> {
  name: string;
  index: number;
  filePath: string;
  media: LazyModelAsync<IMediumModel[], ObjectID[]>;
  links: Link[];
  isVirtual: boolean;
  isPhysical: boolean;
  isAvailable: boolean;
  metadata: Metadata;
  findLoadedMediumById(mediumId: string): IMediumModel;
  loadPlaylistFromFileAndSaveAsync(filePath: string): Promise<IPlaylistModel>;
  updatePlaylistAsync(): Promise<IPlaylistModel>;
  updateFromRequestAsync(playlistRequest: UpsertPlaylistRequest): Promise<IPlaylistModel>;
  addMediumByFilePathAsync(mediaFilePath: string): Promise<IMediumModel>;
  insertMediumByFilePathAsync(mediaFilePath: string, index: number): Promise<IMediumModel>;
  removeMediaAsync(mediumId: ObjectID): Promise<void>;
}

export class PlaylistModel implements IPlaylistModel {
  name: string;
  filePath: string;
  media: LazyModelAsync<IMediumModel[], ObjectID[]>;
  isAvailable: boolean;
  metadata: Metadata;

  constructor(
    private user: IUserModel,
    private playlistService: IPlaylistService,
    private mediaRepository: IMediaRepository,
    private playlistRepository: IPlaylistRepository,
    private mediaService: IMediaService,
    private fileExplorerService: IFileExplorerService,
    public indexer: (model: IPlaylistModel) => number,
    playlist: Playlist|null
  ) {
    this.name = playlist && playlist.name || null;
    this.filePath = playlist && playlist.filePath || null;
    this.metadata = playlist && playlist.metadata || {createdOn: new Date(), updatedOn: null};

    this.isAvailable = false; // TODO For now

    this.media = this.buildLazyMediaModelAsync(playlist && playlist.mediaIds || []);
  }

  private buildLazyMediaModelAsync(mediaIds: ObjectID[]): LazyModelAsync<IMediumModel[], ObjectID[]> {
    return new LazyModelAsync(async(mediumIds: ObjectID[]) => {
      if (this.isPhysical) {
        // Read physical playlist, if file change
        // In such case, reload media TODO (check as it can remove all bookmarks, we shouldn't)
        await this.ifPhysicalPlaylistChangeThenUpdateAsync();
      }

      const media = await Promise.all(
        mediumIds.map(mediumId => this.mediaRepository.getMediumByIdAsync(mediumId))
      );

      return Promise.all(
        media.map(m => MediumModel.buildFromEntity(
          this.mediaService,
          this.mediaRepository,
          () => this.index,
          m))
      );
    }, mediaIds);
  }

  get index(): number {
    return this.indexer(this);
  }

  findLoadedMediumById(mediumId: string): IMediumModel {
    return this.media.value && this.media.value.find(m => m.id === mediumId);
  }

  async loadPlaylistFromFileAndSaveAsync(filePath: string): Promise<IPlaylistModel> {
    // Should give new Pl with media not yet persisted
    const mediaModels = await this.loadMediaFromPhysicalPlaylistAsync(filePath);

    await Promise.all(mediaModels.map(async model => {
      const medium = await this.mediaRepository.addMediumAsync(model.toEntity());
      model.setFromEntity(medium);
    }));

    this.media = new LazyModelAsync(
      async() => mediaModels,
      mediaModels.map(m => m._id)
    );

    this.filePath = filePath;

    const playlistExt = path.extname(filePath);
    this.name = path.basename(filePath, playlistExt);

    await this.updatePlaylistAsync();

    return this;
  }

  async removeMediaAsync(mediumId: ObjectID): Promise<void> {
    await this.mediaRepository.removeMediumByIdAsync(mediumId);

    const media = await this.media.valueAsync;
    const index = media.findIndex(medium => medium._id.equals(mediumId));
    media.splice(index, 1);

    await this.playlistRepository.removeMediumFromPlaylistAsync(
      this.index,
      mediumId,
      this.user._id
    );
  }

  private async ifPhysicalPlaylistChangeThenUpdateAsync(): Promise<boolean> {
    const stat = await nfcall<Stats>(fs.stat, this.filePath);

    const lastUpdateOn = stat.mtime;
    if (this.playlistHasChanged(this.metadata.updatedOn, lastUpdateOn)) {
      await this.updatePlaylistDateReloadMediaAndSaveAsync();
      return true;
    }
    return false;
  }

  private playlistHasChanged(currentPlaylistUpdateDate: Date, lastUpdateDate: Date): boolean {
    return lastUpdateDate > currentPlaylistUpdateDate;
  }

  private async updatePlaylistDateReloadMediaAndSaveAsync(): Promise<IMediumModel[]> {
    // TODO Pb here, we're getting a new playlistModel here, not entity
    // TODO Have 2 methods, one for playlist the other for media?
    await this.clearPlaylist();
    return this.innerFeedPhysicalPlaylistWithMediaAndSaveAsync();
  }

  private async clearPlaylist(): Promise<void> {
    await this.mediaRepository.removeMediaAsync(this.media.value.map(m => m._id));
    this.media = new LazyModelAsync(async () => [], []);
  }

  private async innerFeedPhysicalPlaylistWithMediaAndSaveAsync(): Promise<IMediumModel[]> {
    // Should give new Pl with media not yet persisted
    const mediaModels = await this.loadMediaFromPhysicalPlaylistAsync(this.filePath);

    await Promise.all(mediaModels.map(async model => {
      const medium = await this.mediaRepository.addMediumAsync(model.toEntity());
      model.setFromEntity(medium);
    }));

    this.media = new LazyModelAsync(
      async() => mediaModels,
      mediaModels.map(m => m._id)
    );

    await this.updatePlaylistAsync();

    return mediaModels;
  }

  private async loadMediaFromPhysicalPlaylistAsync(filePath: string): Promise<IMediumModel[]> {
    if (!filePath) {
      throw new Error('filePath must be set');
    }

    const physicalPlaylistService = this.findPhysicalPlaylistServiceFor(filePath);
    if (!physicalPlaylistService) {
      throw new Error(`cannot load playlist of format: ${path.extname(filePath)}`);
    }

    const mediaSummaries = await physicalPlaylistService
      .loadMediaSummariesFromPlaylistAsync(filePath);

    return await Promise.all(mediaSummaries.map(ms =>
      MediumModel.buildFromSummary(
        this.mediaService,
        this.mediaRepository,
        () => this.index,
        ms)
    ))
  }

  // TODO This model s/n have this logic, move to playlist service layer
  private findPhysicalPlaylistServiceFor(plFilePath: string): IPlaylistService {
    return [this.playlistService].find(svc => svc.isOfType(plFilePath));
  }

  async updatePlaylistAsync(): Promise<IPlaylistModel> {
    await this.playlistRepository.updatePlaylistAsync(
      this.index,
      this.toEntity(),
      this.user._id
    );
    return this;
  }

  addMediumByFilePathAsync(mediaFilePath: string): Promise<IMediumModel> {
    return this.insertMediumByFilePathAsync(mediaFilePath, null);
  }

  async insertMediumByFilePathAsync(
    mediaFilePath: string,
    index: number
  ): Promise<IMediumModel> {
    const medium = await this.buildAndInsertMediumByFilePathAsync(
      mediaFilePath,
      index
    );

    await this.playlistRepository.insertMediumToPlaylistAsync(
      this.index,
      medium._id,
      this.user._id
    );

    // if virtual, then update file
    if (!this.isVirtual) {
      await this.findPhysicalPlaylistServiceFor(this.filePath)
        .savePlaylistAsync(this);
    }

    return medium;
  }

  private async buildAndInsertMediumByFilePathAsync(
    mediumFilePath: string,
    index: number
  ): Promise<IMediumModel> {
    const normalizedMediumFilePath = this.fileExplorerService.normalizePathForCurrentOs(mediumFilePath);

    let model = await MediumModel.buildFromFilePathAsync(
      this.mediaService,
      this.mediaRepository,
      () => this.index,
      normalizedMediumFilePath
    );
    const medium = await this.mediaRepository.addMediumAsync(model.toEntity());
    model.setFromEntity(medium);

    if (isNullOrUndefined(index)) { // We'll append medium
      const media = await this.media.valueAsync;
      media.push(model);
    } else {
      const media = await this.media.valueAsync;
      media.splice(index, 0, model);
    }

    return model;
  }

  updateFromRequestAsync(playlistRequest: UpsertPlaylistRequest): Promise<IPlaylistModel> {
    if ('filePath' in playlistRequest) {
      this.filePath = playlistRequest.filePath;
    }
    if ('name' in playlistRequest) {
      this.name = playlistRequest.name;
    }
    if ('media' in playlistRequest) {
      this.media = this.buildLazyMediaModelAsync(
        playlistRequest.mediaIds.map(id => new ObjectID(id))
      );
    }

    return this.updatePlaylistAsync();
  }

  get isVirtual(): boolean {
    return !this.filePath;
  }

  get isPhysical(): boolean {
    return !!this.filePath;
  }

  get links(): Link[] {
    const index = `${this.index}`;
    return [{
      rel: 'self',
      href: routes.playlists.selfPath.replace(':playlistIndex', index)
    }, {
      rel: 'media',
      href: routes.playlists.listMedia.replace(':playlistIndex', index)
    }, {
      rel: 'media.insert',
      href: routes.media.insertPath.replace(':playlistIndex', index)
    }, {
      rel: 'update',
      href: routes.playlists.updatePath.replace(':playlistIndex', index)
    }, {
      rel: 'remove',
      href: routes.playlists.delete.path.replace(':playlistIndex', index)
    }, {
      rel: 'actions.move',
      href: routes.playlists.actions.movePath.replace(':playlistIndex', index)
    }];
  }

  toEntity(): Playlist {
    return {
      name: this.name,
      filePath: this.filePath,
      mediaIds: this.media.entities,
      metadata: this.metadata
    };
  }
}
