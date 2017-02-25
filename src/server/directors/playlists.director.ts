import * as _ from 'lodash';
import {IPlaylistRepository} from '../repositories/playlist.repository';
import {IPlaylistsProxy} from '../proxies/playlists.proxy';
import {IPlaylistDirector} from './playlist.director';
import {IPlaylistBuilder} from '../invokers/playlistBuilder';

export interface IPlaylistsDirector {
  getPlaylistsAsync(issuer);
  addPlaylistAsync(playlistDto, issuer);
  insertPlaylistAsync(playlistDto, issuer, index);
  movePlaylistsAsync(playlistIdIndexes, steps, issuer);
  moveMediasToPlaylistAsync(srcPlaylistId, mediaIds, destPlaylistId, issuer);
  removePlaylistAsync(playlistId, issuer);
}

export default class PlaylistsDirector implements IPlaylistsDirector {
  constructor(
    private playlistDirector: IPlaylistDirector,
    private playlistRepository: IPlaylistRepository,
    private playlistsProxy: IPlaylistsProxy,
    private playlistBuilder: IPlaylistBuilder
  ) {
  }

  getPlaylistsAsync(issuer) {
    return this.playlistsProxy.getPlaylistsAsync(issuer);
  }

  addPlaylistAsync(playlistDto, issuer) {
    return this.insertPlaylistAsync(playlistDto, issuer, null);
  }

  insertPlaylistAsync(playlistDto, issuer, index) {
    let prepareAndGetPosition;
    if (!index) { // We'll append medium
      prepareAndGetPosition = this.playlistsProxy.getPlaylistsCountAsync(issuer);
    } else {
      prepareAndGetPosition = this.makeRoomForPlaylistAtIndexAsync(index, issuer)
        .then(() => {
          return index;
        });
    }

    return prepareAndGetPosition
      .then(position => {
        return playlistDto.isVirtual()
          ? this.buildAndInsertVirtualPlaylistAsync(playlistDto, position, issuer)
          : this.buildAndInsertPhysicalPlaylistAsync(playlistDto, position, issuer);
      });
  }

  movePlaylistsAsync(playlistIdIndexes, steps, issuer) { // TODO To be tested
    if (!playlistIdIndexes || !playlistIdIndexes.length || playlistIdIndexes.length === 0) {
      throw new Error('playlists cannot be empty');
    }

    return this.playlistsProxy
      .getPlaylistIdIndexesAsync(issuer)
      .then(plIdIndexes => {
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

        let plIdIndexes_ = plIdIndexes.slice();

        if (steps > 0) {

          let mediaIndexes = [];
          for (let rowIndex = playlistIdIndexes.length - 1; rowIndex >= 0; rowIndex--) {
            mediaIndexes.push(playlistIdIndexes[rowIndex]);

            let media1ToSwapIndex = playlistIdIndexes[rowIndex];
            let media2ToSwapIndex = playlistIdIndexes[rowIndex] + 1;

            for (let moveIndex = 0; moveIndex < steps; moveIndex++, media1ToSwapIndex++, media2ToSwapIndex++) {
              let media1IdIndex = plIdIndexes_[media1ToSwapIndex];
              media1IdIndex.index = media2ToSwapIndex;

              let media2IdIndex = plIdIndexes_[media2ToSwapIndex];
              media2IdIndex.index = media1ToSwapIndex;

              plIdIndexes_[media1ToSwapIndex] = media2IdIndex;
              plIdIndexes_[media2ToSwapIndex] = media1IdIndex;
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
        return plIdIndexes_;
      })
      .then(plIdsToList => {
        return this.playlistRepository.updatePlaylistIdsPositionAsync(plIdsToList, issuer);
      });
  }

  moveMediasToPlaylistAsync(srcPlaylistId, mediaIds, destPlaylistId, issuer) { // TODO
  }

  removePlaylistAsync(playlistId, issuer) {
    return this.playlistRepository
      .findIndexFromPlaylistIdAsync(playlistId, issuer)
      .then(playlist => this.assertOnPlaylistNotFound(playlist))
      .then((playlist) => { // TODO This parameter is a playlist or an Index ??
        return this.getPlaylistsIdIndexToUpdateForReorderAsync(playlist, issuer);
      })
      .then((plIdLowIdSet) => {
        if (plIdLowIdSet.lowerIds.length > 0) {
          return this.reorderLowerPlaylists(plIdLowIdSet, playlistId, issuer);
        }
      })
      .then(() => {
        return this.playlistsProxy.removePlaylistByIdAsync(playlistId, issuer);
      });
  }

  private assertOnPlaylistNotFound(playlist) {
    if (!playlist) {
      throw new Error('No playlist has been found');
    }
    return playlist;
  }

  private buildAndInsertVirtualPlaylistAsync(playlistDto, index, issuer) {
    const emptyPlaylist = this.playlistBuilder.buildEmptyVirtualPlaylist(playlistDto.name, index, issuer);
    return this.playlistsProxy.saveNewPlaylist(emptyPlaylist, issuer);//utils.saveModelAsync(emptyPlaylist);
  }

  private buildAndInsertPhysicalPlaylistAsync(playlistDto, index, issuer) {
    return this.buildAndInsertEmptyPlaylistFromDtoAsync(playlistDto, index, issuer)
      .then(emptyPlaylist => {
        return this.playlistDirector.feedPhysicalPlaylistWithMediaAndSaveAsync(emptyPlaylist, issuer);
      });
  }

  private buildAndInsertEmptyPlaylistFromDtoAsync(dtoPlaylist, index, issuer) {
    return this.playlistBuilder.buildEmptyPhysicalPlaylistAsync(
      dtoPlaylist.filePath,
      dtoPlaylist.name,
      index,
      issuer
    ).then(emptyPlaylist => {
      return this.playlistsProxy.saveNewPlaylist(emptyPlaylist); // utils.saveModelAsync(emptyPlaylist);
    });
  }

  private makeRoomForPlaylistAtIndexAsync(desiredIndex, issuer) {
    return this.playlistsProxy
      .getPlaylistsCountAsync(issuer)
      .then(count => {
        if (desiredIndex == null) {
          desiredIndex = count;
        } else if (desiredIndex > count || desiredIndex < 0) {
          throw new Error('The given index is out of bounds');
        }

        // If we insert between playlists, then move below playlist down by one.
        if (desiredIndex < count) {
          return this.playlistsProxy
            .getPlaylistIdsLowerThanAsync(desiredIndex, true, issuer)
            .then(plIdIndexesToOffset => {
              const steps = 1;
              for (let index = 0; index < plIdIndexesToOffset.length; index++) {
                plIdIndexesToOffset[index].index += steps;
              }
              return plIdIndexesToOffset;
            })
            .then(plIdIndexesToOffset => {
              return this.playlistRepository.updatePlaylistIdsPositionAsync(plIdIndexesToOffset, issuer);
            });
        }
      });
  }

  private getPlaylistsIdIndexToUpdateForReorderAsync(playlist, issuer) {
    const lowestIndex = playlist.index;

    return this.playlistsProxy
      .getPlaylistIdsLowerThanAsync(lowestIndex, false, issuer)
      .then(plIdsLower => {
        return {lowerIds: plIdsLower, lowestIndex: lowestIndex};
      });
  }

  private reorderLowerPlaylists(plIdLowerSet, playlistIdsToRemove, issuer) {
    const index = plIdLowerSet.lowestIndex;

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
