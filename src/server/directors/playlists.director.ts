import * as _ from 'lodash';
import {IPlaylistRepository} from '../repositories/playlist.repository';
import {IPlaylistsProxy} from '../proxies/playlists.proxy';
import {IPlaylistDirector} from './playlist.director';
import {IPlaylistBuilder} from '../invokers/playlistBuilder';
import {User} from '../models/user.model';
import {Playlist} from '../models/playlist.model';
import {IPlaylistDto} from '../dto/playlist.dto';

export interface IPlaylistsDirector {
  getPlaylistsAsync(issuer: User): Promise<Playlist[]>;
  addPlaylistAsync(playlistDto: IPlaylistDto, issuer: User): Promise<Playlist>;
  insertPlaylistAsync(playlistDto: IPlaylistDto, issuer: User, index: number): Promise<Playlist>;
  movePlaylistsAsync(playlistIdIndexes: number[], steps: number, issuer: User): Promise<Playlist[]>;
  moveMediasToPlaylistAsync(
    srcPlaylistId: string[],
    mediaIds: string[],
    destPlaylistId: string,
    issuer: User);
  removePlaylistAsync(playlistId: string, issuer: User): Promise<void>;
}

export default class PlaylistsDirector implements IPlaylistsDirector {
  constructor(
    private playlistDirector: IPlaylistDirector,
    private playlistRepository: IPlaylistRepository,
    private playlistsProxy: IPlaylistsProxy,
    private playlistBuilder: IPlaylistBuilder
  ) {
  }

  getPlaylistsAsync(issuer: User): Promise<Playlist[]> {
    return this.playlistsProxy.getPlaylistsAsync(issuer);
  }

  addPlaylistAsync(playlistDto: IPlaylistDto, issuer: User): Promise<Playlist> {
    return this.insertPlaylistAsync(playlistDto, issuer, null);
  }

  async insertPlaylistAsync(playlistDto: IPlaylistDto, issuer: User, index: number): Promise<Playlist> {
    let position;
    if (!index) { // We'll append medium
      position = await this.playlistsProxy.getPlaylistsCountAsync(issuer);
    } else {
      await this.makeRoomForPlaylistAtIndexAsync(index, issuer);
      position = index;
    }

    return playlistDto.isVirtual
      ? this.buildAndInsertVirtualPlaylistAsync(playlistDto, position, issuer)
      : this.buildAndInsertPhysicalPlaylistAsync(playlistDto, position, issuer);
  }

  async movePlaylistsAsync(playlistIdIndexes: number[], steps: number, issuer: User): Promise<Playlist[]> { // TODO To be tested
    if (!playlistIdIndexes || !playlistIdIndexes.length || playlistIdIndexes.length === 0) {
      throw new Error('playlists cannot be empty');
    }

    const plIdIndexes = await this.playlistsProxy
      .getPlaylistIdIndexesAsync(issuer);

    const lowerIndex = _(plIdIndexes)
      .map(x => x.index)
      .min();
    const higherIndex = _(plIdIndexes)
      .map(x => x.index)
      .max();

    const isValidLowerBound = lowerIndex + steps >= 0;
    const isValidUpperBound = higherIndex + steps <= plIdIndexes.length;
    if (!isValidLowerBound || !isValidUpperBound) {
      throw new Error('steps value is outer bounds');
    }

    let plIds = plIdIndexes.map(x => {
      return x._id.toString();
    });

    let plIdsToList = plIdIndexes.slice();

    if (steps > 0) {

      let mediaIndexes = [];
      for (let rowIndex = playlistIdIndexes.length - 1; rowIndex >= 0; rowIndex--) {
        mediaIndexes.push(playlistIdIndexes[rowIndex]);

        let media1ToSwapIndex = playlistIdIndexes[rowIndex];
        let media2ToSwapIndex = playlistIdIndexes[rowIndex] + 1;

        for (let moveIndex = 0; moveIndex < steps; moveIndex++, media1ToSwapIndex++, media2ToSwapIndex++) {
          let media1IdIndex = plIdsToList[media1ToSwapIndex];
          media1IdIndex.index = media2ToSwapIndex;

          let media2IdIndex = plIdsToList[media2ToSwapIndex];
          media2IdIndex.index = media1ToSwapIndex;

          plIdsToList[media1ToSwapIndex] = media2IdIndex;
          plIdsToList[media2ToSwapIndex] = media1IdIndex;
        }
      }

    } else {
    }

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

    return await this.playlistRepository.updatePlaylistIdsPositionAsync(plIdsToList, issuer);
  }

  moveMediasToPlaylistAsync(
    srcPlaylistId: string[],
    mediaIds: string[],
    destPlaylistId: string,
    issuer: User
  ) { // TODO
  }

  async removePlaylistAsync(playlistId: string, issuer: User): Promise<void> {
    let playlist = await this.playlistRepository
      .findIndexFromPlaylistIdAsync(playlistId, issuer);

    playlist = this.assertOnPlaylistNotFound(playlist);
    // TODO This parameter is a playlist or an Index ??
    const plIdLowIdSet = await this.getPlaylistsIdIndexToUpdateForReorderAsync(playlist, issuer);

    if (plIdLowIdSet.lowerIds.length > 0) {
      await this.reorderLowerPlaylists(plIdLowIdSet, playlistId, issuer);
    }

    return this.playlistsProxy.removePlaylistByIdAsync(playlistId, issuer);
  }

  private assertOnPlaylistNotFound(playlist: Playlist): Playlist {
    if (!playlist) {
      throw new Error('No playlist has been found');
    }
    return playlist;
  }

  private buildAndInsertVirtualPlaylistAsync(playlistDto: IPlaylistDto, index: number, issuer: User): Promise<Playlist> {
    const emptyPlaylist = this.playlistBuilder.buildEmptyVirtualPlaylist(playlistDto.name, index, issuer);
    return this.playlistsProxy.saveNewPlaylist(emptyPlaylist, issuer); // utils.saveModelAsync(emptyPlaylist);
  }

  private async buildAndInsertPhysicalPlaylistAsync(playlistDto: IPlaylistDto, index: number, issuer: User): Promise<Playlist> {
    const emptyPlaylist = await this.buildAndInsertEmptyPlaylistFromDtoAsync(playlistDto, index, issuer);
    return this.playlistDirector.feedPhysicalPlaylistWithMediaAndSaveAsync(emptyPlaylist, issuer);
  }

  private async buildAndInsertEmptyPlaylistFromDtoAsync(dtoPlaylist: IPlaylistDto, index: number, issuer: User): Promise<Playlist> {
    const emptyPlaylist = await this.playlistBuilder.buildEmptyPhysicalPlaylistAsync(
      dtoPlaylist.filePath,
      dtoPlaylist.name,
      index,
      issuer
    );
    return this.playlistsProxy.saveNewPlaylist(emptyPlaylist, issuer); // utils.saveModelAsync(emptyPlaylist);
  }

  private async makeRoomForPlaylistAtIndexAsync(desiredIndex: number, issuer: User): Promise<Playlist[]> {
    const count = await this.playlistsProxy
      .getPlaylistsCountAsync(issuer);

    if (desiredIndex == null) {
      desiredIndex = count;
    } else if (desiredIndex > count || desiredIndex < 0) {
      throw new Error('The given index is out of bounds');
    }

    // If we insert between playlists, then move below playlist down by one.
    if (desiredIndex < count) {
      const plIdIndexesToOffset = await this.playlistsProxy
        .getPlaylistIdsLowerThanAsync(desiredIndex, true, issuer);

      const steps = 1;
      for (let index = 0; index < plIdIndexesToOffset.length; index++) {
        plIdIndexesToOffset[index].index += steps;
      }

      return this.playlistRepository.updatePlaylistIdsPositionAsync(plIdIndexesToOffset, issuer);
    }
  }

  private async getPlaylistsIdIndexToUpdateForReorderAsync(
    playlist: Playlist,
    issuer: User
  ): Promise<{lowerIds: string[], lowestIndex: number}> {
    const lowestIndex = playlist.index;

    const plIdsLower = await this.playlistsProxy
      .getPlaylistIdsLowerThanAsync(lowestIndex, false, issuer);

    return {lowerIds: plIdsLower, lowestIndex: lowestIndex};
  }

  private reorderLowerPlaylists(
    plIdLowerSet: {lowerIds: string[], lowestIndex: number},
    playlistIdsToRemove: string[],
    issuer: User
  ): Promise<Playlist[]> {
    let index = plIdLowerSet.lowestIndex;

    const plIdReordered = plIdLowerSet.lowerIds
      .filter(lowerId => {
        // Only increment playlists not to be deleted
        return playlistIdsToRemove.indexOf(lowerId._id) === -1;
      })
      .map(lowerId => {
        return {_id: lowerId._id, index: index++};
      });

    return this.playlistRepository.updatePlaylistIdsPositionAsync(plIdReordered, issuer);
  }
}
