import * as fs from 'fs';
import * as fsHelper from '../utils/fsHelpers';
import {nfcall} from '../utils/promiseHelpers';
import {IMediaBuilder} from '../invokers/mediaBuilder';
import {IPlaylistProxy} from '../proxies/playlist.proxy';
import {IPlaylistsProxy} from '../proxies/playlists.proxy';
import {IMediaRepository} from '../repositories/media.repository';
import {IFileExplorerService} from '../services/fileExplorers/fileExplorer.service';
// TODO Should instead represent all available playlist services, not one
import {IPlaylistService} from '../services/m3uPlaylist.service';
import {Playlist} from '../models/playlist.model';
import {User} from '../models/user.model';
import {IMediumModel, MediumDocument} from '../models/medium.model';
import {Stats} from 'fs';
import {IPlaylistDto} from '../dto/playlist.dto';

export interface IPlaylistDirector {
  updatePlaylistAsync(playlistId: string, playlistDto: IPlaylistDto, issuer: User): Promise<Playlist>;
  getMediaFromPlaylistByIdAsync(playlistId: string, issuer: User): Promise<MediumDocument[]>;
  addMediumByFilePathAsync(playlistId: string, mediaFilePath: string, issuer: User): Promise<IMediumModel>;
  insertMediumByFilePathAsync(
    playlistId: string,
    mediaFilePath: string,
    index: number,
    issuer: User
  ): Promise<IMediumModel>;
  removeMediaAsync(playlistId: string, mediaId: string, issuer: User): Promise<Playlist>;
  feedPhysicalPlaylistWithMediaAndSaveAsync(emptyPlaylist: Playlist, issuer: User): Promise<Playlist>;
}

export default class PlaylistDirector implements IPlaylistDirector {
  constructor(
    private playlistProxy: IPlaylistProxy,
    private playlistsProxy: IPlaylistsProxy,
    private mediaRepository: IMediaRepository,
    private fileExplorerService: IFileExplorerService,
    private physicalPlaylistServices: IPlaylistService,
    private mediaBuilder: IMediaBuilder
  ) {
  }

  async updatePlaylistAsync(playlistId: string, playlistDto: IPlaylistDto, issuer: User): Promise<Playlist> {
    await this.playlistProxy
      .getMediaCountForPlaylistByIdAsync(playlistId, issuer);

    return this.playlistProxy.updatePlaylistDtoAsync(
      playlistId,
      playlistDto,
      issuer
    );

    // Exception can happen in case playlist doesn't exists anymore
  }

  async getMediaFromPlaylistByIdAsync(playlistId: string, issuer: User): Promise<MediumDocument[]> {
    let playlist = await this.playlistProxy
      .getPlaylistWithMediaAsync(playlistId, issuer);

    playlist = this.assertOnNotFound(playlist);

    let playlistResultSet: {playlist: Playlist, reloaded: boolean};
    if (playlist.isVirtual) {
      // A virtual playlist won't change outside (compared to physical)
      playlistResultSet = {playlist: playlist, reloaded: false};
    } else {
      playlistResultSet = await this.ifPhysicalPlaylistChangeThenUpdateAsync(playlist, issuer);
    }

    const pl = await this.ifPlaylistNotReloadedCheckMediaAvailabilityAsync(playlistResultSet);
    return pl.media;
  }

  addMediumByFilePathAsync(playlistId: string, mediaFilePath: string, issuer: User): Promise<IMediumModel> {
    return this.insertMediumByFilePathAsync(playlistId, mediaFilePath, null, issuer);
  }

  async insertMediumByFilePathAsync(
    playlistId: string,
    mediaFilePath: string,
    index: number,
    issuer: User
  ): Promise<IMediumModel> {
    //let prepareAndGetPosition;
    let mediaPosition: number;
    if (index === undefined || index === null) { // We'll append medium
      mediaPosition = await this.playlistProxy.getMediaCountForPlaylistByIdAsync(playlistId, issuer);
    } else {
      await this.makeRoomForMediaAtIndexFromPlaylistIdAsync(playlistId, index, issuer);
      mediaPosition = index;
    }

    const unlinkedMedium = await this.buildAndInsertMediumByFilePathAsync(playlistId, mediaFilePath, mediaPosition, issuer);
    const linkedMedium = await this.playlistProxy.insertMediumToPlaylistAsync(playlistId, unlinkedMedium, issuer);
    const playlist = await this.playlistProxy
      .getPlaylistWithMediaAsync(playlistId, issuer);

    // if virtual, then update file
    if (!playlist.isVirtual) {
      await this.findPhysicalPlaylistServiceFor(playlist.filePath)
        .savePlaylistAsync(playlist);
    }

    return linkedMedium;
  }

  async removeMediaAsync(playlistId: string, mediaId: string, issuer: User): Promise<Playlist> {
    const index = await this.mediaRepository.findIndexFromMediaIdsAsync(mediaId, issuer);
    const mediaIndex = await this.assertOnNotFound(index);
    const plIdLowIdSet = await this.getMediaIdIndexToUpdateForReorderAsync(playlistId, mediaIndex, issuer);

    if (plIdLowIdSet.lowerIds.length > 0) {
      await this.reorderLowerMedia(plIdLowIdSet, mediaId, issuer);
    }
    return this.playlistProxy.removeMediaFromPlaylistAsync(playlistId, mediaId, issuer);
  }

  feedPhysicalPlaylistWithMediaAndSaveAsync(emptyPlaylist: Playlist, issuer: User): Promise<Playlist> {
    return this.innerFeedPhysicalPlaylistWithMediaAndSaveAsync(emptyPlaylist, issuer);
  }

  private async ifPlaylistNotReloadedCheckMediaAvailabilityAsync(
    plReloadedSet: {playlist: Playlist, reloaded: boolean}
  ): Promise<Playlist> {
    const checkAndUpdatePromises = plReloadedSet.playlist.media.map(async medium => {
      const fileExists = await fsHelper.checkFileExistsAsync(medium.filePath);
      // TODO Move this to Model when Mongoose doc comes up (move hasChanged to model). isAvailable shouldn't be stored
      const isAvailableChanged = medium.isAvailable !== fileExists;
      if (isAvailableChanged) {
        return {
          medium: medium.setIsAvailable(fileExists),
          hasChanged: isAvailableChanged
        };
      }
      return {
        medium: medium,
        hasChanged: isAvailableChanged
      };
    });

    const mediaHasChangedSet = await Promise.all(checkAndUpdatePromises);

    // Filter the ones to update
    const mediaToUpdate = mediaHasChangedSet
      .filter(mediumHasChanged => mediumHasChanged.hasChanged)
      .map(mediumHasChanged => mediumHasChanged.medium);

    const mediaToUpdatePromises = mediaToUpdate.map(medium => medium.save());

    await Promise.all(mediaToUpdatePromises);

    return plReloadedSet.playlist;
  }

  private async ifPhysicalPlaylistChangeThenUpdateAsync(
    playlist: Playlist,
    issuer: User
  ): Promise<{playlist: Playlist, reloaded: boolean}> {
    const stat = await nfcall<Stats>(fs.stat, playlist.filePath);

    const lastUpdateOn = stat.mtime;
    if (this.playlistHasChanged(playlist.updatedOn, lastUpdateOn)) {
      const pl = await this.updatePlaylistDateReloadMediaAndSaveAsync(playlist, lastUpdateOn, issuer);
      return {playlist: pl, reloaded: true};
    }
    return {playlist: playlist, reloaded: false};
  }

  private async updatePlaylistDateReloadMediaAndSaveAsync(
    playlist: Playlist,
    lastUpdateOn: Date,
    issuer: User
  ): Promise<Playlist> {
    let cleanPl = await this.playlistProxy//_playlistRepository
      .removeAllMediaFromPlaylistAsync(playlist, issuer);
    let cleanPlUpdated = await cleanPl.setUpdatedOn(lastUpdateOn);
    let savedPlaylist = await cleanPlUpdated.save();
    return this.innerFeedPhysicalPlaylistWithMediaAndSaveAsync(savedPlaylist, issuer);
  }

  private playlistHasChanged(currentPlaylistUpdateDate: Date, lastUpdateDate: Date): boolean {
    return lastUpdateDate > currentPlaylistUpdateDate;
  }

  private saveMediaAsync(media: IMediumModel[]): Promise<MediumDocument[]> {
    const addMediaPromises = media.map(medium => medium.save());
    return Promise.all(addMediaPromises);
  }

  private buildAndInsertMediumByFilePathAsync(
    playlistId: string,
    mediaFilePath: string,
    desiredIndex: number,
    issuer: User
  ): Promise<MediumDocument> {
    mediaFilePath = this.fileExplorerService.normalizePathForCurrentOs(mediaFilePath);
    return this.mediaBuilder
      .buildMediumAsync(playlistId, mediaFilePath, desiredIndex, issuer)
      .then(medium => medium.save());
  }

  private async makeRoomForMediaAtIndexFromPlaylistIdAsync(
    playlistId: string,
    desiredIndex: number,
    issuer: User
  ): Promise<Playlist[]> { // TODO Why playlistId is demanded ?
    const count = await this.playlistsProxy.getPlaylistsCountAsync(issuer);

    if (desiredIndex == null || desiredIndex > count) {
      desiredIndex = count;
    } else if (desiredIndex < 0) {
      throw new Error('The given index is out of bounds'); // TODO To clean exceptions
    }

    // If we insert between playlists, then move below playlist down by one.
    if (desiredIndex < count) {
      const plIdIndexesToOffset = await this.playlistsProxy
        .getPlaylistIdsLowerThanAsync(desiredIndex, true, issuer);

      let steps = 1;
      for (let index = 0; index < plIdIndexesToOffset.length; index++) {
        plIdIndexesToOffset[index].index += steps;
      }

      return this.playlistProxy.updatePlaylistIdsPositionAsync(plIdIndexesToOffset, issuer);
    }
  }

  private async getMediaIdIndexToUpdateForReorderAsync(
    playlistId: string,
    mediaIndex: number,
    issuer: User): Promise<{lowerIds: string[], lowestIndex: number}> {
    const mediaIdsLower = await this.playlistProxy
      .getMediaIdsLowerThanAsync(playlistId, mediaIndex, false, issuer);
    return {lowerIds: mediaIdsLower, lowestIndex: mediaIndex};
  }

  private reorderLowerMedia(
    mediaIdsLowerSet: {lowestIndex: number, lowerIds: string[]},
    mediaIdToRemove: string,
    issuer: User
  ): Promise<void> {
    let index = mediaIdsLowerSet.lowestIndex;

    const mediaIdsReordered = mediaIdsLowerSet.lowerIds
      .filter(lowerId =>
        // Only increment playlists not to be deleted
        mediaIdToRemove !== String(lowerId)
      )
      .map(lowerId => {
        return {_id: lowerId, index: index++};
      });

    return this.mediaRepository.updateMediaIndexByIdsAsync(mediaIdsReordered, issuer);
  }

  private async innerFeedPhysicalPlaylistWithMediaAndSaveAsync(
    emptyPlaylist: Playlist,
    issuer: User
  ): Promise<Playlist> {
    // Should give new Pl with media not yet persisted
    let media = await this.loadMediaFromPhysicalPlaylistAsync(emptyPlaylist, issuer);
    media = await this.saveMediaAsync(media);

    return this.playlistProxy.insertMediaToPlaylistReturnSelfAsync(
      emptyPlaylist.id,
      media,
      issuer
    );
  }

  private loadMediaFromPhysicalPlaylistAsync(emptyPlaylist: Playlist, issuer: User): Promise<IMediumModel[]> {
    if (!emptyPlaylist) {
      throw new Error('PlaylistDirector.injectMediaToPhysicalPlaylistAsync: playlist must be set');
    }

    const filePath = emptyPlaylist.filePath;
    if (!filePath) {
      throw new Error('PlaylistDirector.injectMediaToPhysicalPlaylistAsync: playlist.FilePath must be set');
    }

    const physicalPlaylistService = this.findPhysicalPlaylistServiceFor(filePath);
    if (!physicalPlaylistService) {
      throw new Error(`PlaylistDirector.injectMediaToPhysicalPlaylistAsync cannot load playlist of format: ${fs.extname(filePath)}`);
    }

    const plId = emptyPlaylist.id;
    return physicalPlaylistService
      .loadMediaSummariesFromPlaylistAsync(filePath)
      .then(ms => {
        return this.mediaBuilder.toMediaAsync(ms, plId, issuer);
      });
  }

  private findPhysicalPlaylistServiceFor(plFilePath: string): IPlaylistService {
    return [this.physicalPlaylistServices]
      .find(svc => svc.isOfType(plFilePath));
  }

  private assertOnNotFound<T>(data: T): T {
    if (data === undefined || data === null) {
      throw new Error('No data has been found');
    }
    return data;
  }
}
