import * as _ from 'lodash';
import {IPlaylistModel, PlaylistModel} from './playlist.model';
import {IUserModel} from './user.model';
import {UpsertPlaylistRequest} from '../requests/updatePlaylist.request';
import {Playlist} from '../entities/playlist';
import {IPlaylistService} from '../services/m3uPlaylist.service';
import {IMediaRepository} from '../repositories/media.repository';
import {IPlaylistRepository} from '../repositories/playlist.repository';
import {IMediaService} from '../services/media.service';
import {IFileExplorerService} from '../services/fileExplorers/fileExplorer.service';
import {isNullOrUndefined} from 'util';
import {IMediumModel} from './medium.model';

export interface IPlaylistCollection {
  getByIndex(playlistIndex: number): IPlaylistModel;
  findLoadedMediumById(mediumId: string): IMediumModel;
  getAsync(): IPlaylistModel[];
  addAsync(playlistDto: UpsertPlaylistRequest): Promise<IPlaylistModel>;
  insertAsync(request: UpsertPlaylistRequest, position: number): Promise<IPlaylistModel>;
  moveAsync(playlistIdIndexes: number[], steps: number): Promise<IPlaylistModel[]>;
  moveMediasToPlaylistAsync(
    srcPlaylistId: string[],
    mediaIds: string[],
    destPlaylistId: string);
  removeAsync(playlistIndex: number): Promise<void>;
  toEntity(): Playlist[];
}

export default class PlaylistCollection implements IPlaylistCollection {
  private playlists: IPlaylistModel[];

  constructor(
    private user: IUserModel,
    private physicalPlaylistServices: IPlaylistService,
    private mediaRepository: IMediaRepository,
    private playlistRepository: IPlaylistRepository,
    private mediaService: IMediaService,
    private fileExplorerService: IFileExplorerService,
    playlists: Playlist[]
  ) {
    this.playlists = playlists && playlists.map(playlist => new PlaylistModel(
      user,
      physicalPlaylistServices,
      mediaRepository,
      playlistRepository,
      mediaService,
      fileExplorerService,
      this.getPlaylistIndex.bind(this),
      playlist
    )) || [];
  }

  getAsync(): IPlaylistModel[] {
    return this.playlists;
  }

  findLoadedMediumById(mediumId: string): IMediumModel {
    for (const p of this.playlists) {
      const medium = p.findLoadedMediumById(mediumId);
      if (medium) {
        return medium;
      }
    }
  }

  getByIndex(playlistIndex: number): IPlaylistModel {
    return this.playlists[playlistIndex];
  }

  addAsync(request: UpsertPlaylistRequest): Promise<IPlaylistModel> {
    return isNullOrUndefined(request.filePath) || request.filePath === ''
      ? this.buildAndInsertVirtualPlaylistAsync(request)
      : this.buildAndInsertPhysicalPlaylistAsync(request);
  }

  async insertAsync(request: UpsertPlaylistRequest, position: number): Promise<IPlaylistModel> {
    return isNullOrUndefined(request.filePath) || request.filePath === ''
      ? this.buildAndInsertVirtualPlaylistAsync(request, position)
      : this.buildAndInsertPhysicalPlaylistAsync(request, position);
  }

  private getPlaylistIndex(model: IPlaylistModel): number {
    return this.playlists.indexOf(model);
  }

  private async buildAndInsertVirtualPlaylistAsync(
    request: UpsertPlaylistRequest,
    position?: number
  ): Promise<IPlaylistModel> {
    const entity: Playlist = {
      name: request.name,
        filePath: null,
        mediaIds: [],
        metadata: {createdOn: new Date(), updatedOn: null}
    };
    const emptyPlaylist = new PlaylistModel(
      this.user,
      this.physicalPlaylistServices,
      this.mediaRepository,
      this.playlistRepository,
      this.mediaService,
      this.fileExplorerService,
      this.getPlaylistIndex.bind(this),
      entity
    );

    let playlist: Playlist;
    if (isNullOrUndefined(position)) {
      playlist = await this.playlistRepository.addPlaylistAsync(emptyPlaylist.toEntity(), this.user._id);
    } else {
      playlist = await this.playlistRepository.insertPlaylistAsync(
        emptyPlaylist.toEntity(),
        position,
        this.user._id);
    }

    return new PlaylistModel(
      this.user,
      this.physicalPlaylistServices,
      this.mediaRepository,
      this.playlistRepository,
      this.mediaService,
      this.fileExplorerService,
      this.getPlaylistIndex.bind(this),
      playlist
    )
  }

  private async buildAndInsertPhysicalPlaylistAsync(
    request: UpsertPlaylistRequest,
    position?: number
  ): Promise<IPlaylistModel> {
    const entity: Playlist = {
      name: request.name,
      filePath: request.filePath,
      mediaIds: [],
      metadata: {createdOn: new Date(), updatedOn: null}
    };
    let playlist = new PlaylistModel(
      this.user,
      this.physicalPlaylistServices,
      this.mediaRepository,
      this.playlistRepository,
      this.mediaService,
      this.fileExplorerService,
      this.getPlaylistIndex.bind(this),
      entity
    );

    await playlist.loadPlaylistFromFileAndSaveAsync(request.filePath);
    if (isNullOrUndefined(position)) {
      await this.playlistRepository.addPlaylistAsync(
        playlist.toEntity(),
        this.user._id);
    } else {
      await this.playlistRepository.insertPlaylistAsync(
        playlist.toEntity(),
        position,
        this.user._id);
    }
    this.playlists.splice(position, 0, playlist);

    return playlist;
  }

  async moveAsync(playlistIdIndexes: number[], steps: number): Promise<IPlaylistModel[]> {
    if (!playlistIdIndexes || !playlistIdIndexes.length || playlistIdIndexes.length === 0) {
      throw new Error('playlists cannot be empty');
    }

    // const plIdIndexes = await this.playlistsProxy
    //   .getPlaylistIdIndexesAsync(issuer);

    const lowestIndex =  _(playlistIdIndexes).min();
    const highestIndex = _(playlistIdIndexes).max();

    const isValidLowerBound = lowestIndex + steps >= 0;
    const isValidUpperBound = highestIndex + steps <= playlistIdIndexes.length;
    if (!isValidLowerBound || !isValidUpperBound) {
      throw new Error('steps value is outer bounds');
    }

    // let plIds = playlistIdIndexes.map(x => {
    //   return x._id.toString();
    // });

    // let plIdsToList = plIdIndexes.slice();
    //
    // if (steps > 0) {
    //
    //   let mediaIndexes = [];
    //   for (let rowIndex = playlistIdIndexes.length - 1; rowIndex >= 0; rowIndex--) {
    //     mediaIndexes.push(playlistIdIndexes[rowIndex]);
    //
    //     let media1ToSwapIndex = playlistIdIndexes[rowIndex];
    //     let media2ToSwapIndex = playlistIdIndexes[rowIndex] + 1;
    //
    //     for (let moveIndex = 0; moveIndex < steps; moveIndex++, media1ToSwapIndex++, media2ToSwapIndex++) {
    //       let media1IdIndex = plIdsToList[media1ToSwapIndex];
    //       media1IdIndex.index = media2ToSwapIndex;
    //
    //       let media2IdIndex = plIdsToList[media2ToSwapIndex];
    //       media2IdIndex.index = media1ToSwapIndex;
    //
    //       plIdsToList[media1ToSwapIndex] = media2IdIndex;
    //       plIdsToList[media2ToSwapIndex] = media1IdIndex;
    //     }
    //   }
    //
    // } else {
    // }

    //for (var rowIndex = 0; rowIndex < playlistIdIndexes.length; rowIndex++) {
    ////for (var playlistIdIndex in playlistIdIndexes) {
    //	var playlistIdToMove = playlistIdIndexes[rowIndex];
    //
    //	var currentIndex = plIds.indexOf(playlistIdToMove._id);
    //
    //	//for (var rowIndexPlToOffset = currentIndex; rowIndexPlToOffset < plIdIndexes.length; rowIndexPlToOffset++) {
    //	//}
    //	//delete plIds[currentIndex];
    //	var newIndex = currentIndex + steps + 1;
    //	plIds[newIndex] = {_id: playlistIdToMove._id, index: newIndex};
    //}

    //return from(plIds)
    //	.where(function(plId) {
    //		var actualIndex = plIdIndexes.indexOf(plId)
    //		var newIndex = plIds.indexOf(plId);
    //		return actualIndex != newIndex;
    //	})
    //	.toArray();

    // return await this.playlistRepository.updatePlaylistIdsPositionAsync(/*plIdsToList*/null, this.user);
    return playlistIdIndexes.map(index => this.playlists[index]);
  }


  moveMediasToPlaylistAsync(srcPlaylistId: string[], mediaIds: string[], destPlaylistId: string) {
    throw new Error('Method not implemented.');
  }

  async removeAsync(playlistIndex: number): Promise<void> {
    await this.playlistRepository.removePlaylistByIndexAsync(playlistIndex, this.user._id);
    const [deletedPlaylist] = this.playlists.splice(playlistIndex, 1);

    await this.mediaRepository.removeMediaAsync(deletedPlaylist.media.entities)
  }

  toEntity(): Playlist[] {
    return this.playlists.map(p => p.toEntity());
  }
}
