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

export interface IPlaylistDirector {
  updatePlaylistAsync(playlistId, playlistDto, issuer);
  getMediaFromPlaylistByIdAsync(playlistId, issuer);
  addMediumByFilePathAsync(playlistId, mediaFilePaths, issuer);
  insertMediumByFilePathAsync(playlistId, mediaFilePath, index, issuer);
  removeMediaAsync(playlistId, mediaId, issuer);
  feedPhysicalPlaylistWithMediaAndSaveAsync(emptyPlaylist, issuer);
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

  updatePlaylistAsync(playlistId, playlistDto, issuer) {
    return this.playlistProxy
      .getMediaCountForPlaylistByIdAsync(playlistId, issuer)
      .then(() => {
        return this.playlistProxy.updatePlaylistDtoAsync(
          playlistId,
          playlistDto,
          issuer
        );
      }/*, function(err) { // In case playlist doesn't exists anymore

       }*/);
  }

  getMediaFromPlaylistByIdAsync(playlistId, issuer) {
    return this.playlistProxy
      .getPlaylistWithMediaAsync(playlistId, issuer)
      .then(playlist => this.assertOnNotFound(playlist))
      .then(playlist => {
        if (playlist.isVirtual) {
          // A virtual playlist won't change outside (compared to physical)
          return {playlist: playlist, reloaded: false};
        } else {
          return this.ifPhysicalPlaylistChangeThenUpdateAsync(playlist, issuer);
        }
      })
      .then(playlist =>
        this.ifPlaylistNotReloadedCheckMediaAvailabilityAsync(playlist)
      )
      .then(pl => {
        return pl.media;
      });
  }

  addMediumByFilePathAsync(playlistId, mediaFilePaths, issuer) {
    return this.insertMediumByFilePathAsync(playlistId, mediaFilePaths, null, issuer);
  }

  insertMediumByFilePathAsync(playlistId, mediaFilePath, index, issuer) {
    let prepareAndGetPosition;
    if (index === undefined || index === null) { // We'll append medium
      prepareAndGetPosition = this.playlistProxy.getMediaCountForPlaylistByIdAsync(playlistId, issuer);
    } else {
      prepareAndGetPosition = this.makeRoomForMediaAtIndexFromPlaylistIdAsync(playlistId, index, issuer)
        .then(() => {
          return index;
        });
    }

    return prepareAndGetPosition
      .then(mediaPosition => {
        return this.buildAndInsertMediumByFilePathAsync(playlistId, mediaFilePath, mediaPosition, issuer);
      })
      .then(unlinkedMedium => {
        return this.playlistProxy.insertMediumToPlaylistAsync(playlistId, unlinkedMedium, issuer);
      })
      .then(linkedMedium => {
        return this.playlistProxy
          .getPlaylistWithMediaAsync(playlistId, issuer)
          .then(playlist => {
            // if virtual, then update file
            if (!playlist.isVirtual) {
              return this.findPhysicalPlaylistServiceFor(playlist.filePath)
                .savePlaylistAsync(playlist)
                .then(() => {
                  return linkedMedium;
                });
            }
            return linkedMedium;
          });
      });
  }

  removeMediaAsync(playlistId, mediaId, issuer) {
    return this.mediaRepository
      .findIndexFromMediaIdsAsync(mediaId, issuer)
      .then(index => this.assertOnNotFound(index))
      .then(mediaIndex => {
        return this.getMediaIdIndexToUpdateForReorderAsync(playlistId, mediaIndex, issuer);
      })
      .then(plIdLowIdSet => {
        if (plIdLowIdSet.lowerIds.length > 0) {
          return this.reorderLowerMedia(plIdLowIdSet, mediaId, issuer);
        }
      })
      .then(() => {
        return this.playlistProxy.removeMediaFromPlaylistAsync(playlistId, mediaId, issuer);
      });
  }

  feedPhysicalPlaylistWithMediaAndSaveAsync(emptyPlaylist, issuer) {
    return this.innerFeedPhysicalPlaylistWithMediaAndSaveAsync(emptyPlaylist, issuer);
  }

  private ifPlaylistNotReloadedCheckMediaAvailabilityAsync(plReloadedSet) {
    const checkAndUpdatePromises = plReloadedSet.playlist.media.map(medium => {
      return fsHelper.checkFileExistsAsync(medium.filePath)
        .then(fileExists => {
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
    });

    return Promise.all(checkAndUpdatePromises)
      .then(mediaHasChangedSet => {
        // Filter the ones to update
        const mediaToUpdate = mediaHasChangedSet
          .filter(mediumHasChanged => {
            return mediumHasChanged.hasChanged;
          })
          .map(mediumHasChanged => {
            return mediumHasChanged.medium;
          });

        const mediaToUpdatePromises = mediaToUpdate.map(medium => {
          return medium.save();
        });

        return Promise.all(mediaToUpdatePromises);
      })
      .then(() => {
        return plReloadedSet.playlist;
      });
  }

  private ifPhysicalPlaylistChangeThenUpdateAsync(playlist, issuer) {
    return nfcall(fs.stat, playlist.filePath).then(stat => {
        const lastUpdateOn = stat.mtime;
        if (this.playlistHasChanged(playlist.updatedOn, lastUpdateOn)) {
          return this.updatePlaylistDateReloadMediaAndSaveAsync(playlist, lastUpdateOn, issuer)
            .then(pl => {
              return {playlist: pl, reloaded: true};
            });
        }
        return {playlist: playlist, reloaded: false};
      });
  }

  private updatePlaylistDateReloadMediaAndSaveAsync(playlist, lastUpdateOn, issuer) {
    return this.playlistProxy//_playlistRepository
      .removeAllMediaFromPlaylistAsync(playlist.id, issuer)
      .then(cleanPl => {
        return cleanPl.setUpdatedOn(lastUpdateOn);
      })
      .then(cleanPlUpdated => {
        return cleanPlUpdated.save();
      })
      .then(savedPlaylist => {
        return this.innerFeedPhysicalPlaylistWithMediaAndSaveAsync(savedPlaylist, issuer);
      });
  }

  private playlistHasChanged(currentPlaylistUpdateDate, lastUpdateDate) {
    return lastUpdateDate > currentPlaylistUpdateDate;
  }

  private saveMediaAsync(media) {
    const addMediaPromises = media.map(medium => {
      return medium.save();
    });
    return Promise.all(addMediaPromises);
  }

  private buildAndInsertMediumByFilePathAsync(playlistId, mediaFilePath, desiredIndex, issuer) {
    mediaFilePath = this.fileExplorerService.normalizePathForCurrentOs(mediaFilePath);
    return this.mediaBuilder
      .buildMediumAsync(playlistId, mediaFilePath, desiredIndex, issuer)
      .then(medium => medium.save());
  }

  private makeRoomForMediaAtIndexFromPlaylistIdAsync(playlistId, desiredIndex, issuer) { // TODO Why playlistId is demanded ?
    return this.playlistsProxy
      .getPlaylistsCountAsync(issuer)
      .then(count => {
        if (desiredIndex == null || desiredIndex > count) {
          desiredIndex = count;
        } else if (desiredIndex < 0) {
          throw new Error('The given index is out of bounds'); // TODO To clean exceptions
        }

        // If we insert between playlists, then move below playlist down by one.
        if (desiredIndex < count) {
          return this.playlistsProxy
            .getPlaylistIdsLowerThanAsync(desiredIndex, true, issuer)
            .then(plIdIndexesToOffset => {
              let steps = 1;
              for (let index = 0; index < plIdIndexesToOffset.length; index++) {
                plIdIndexesToOffset[index].index += steps;
              }
              return plIdIndexesToOffset;
            })
            .then(plIdIndexesToOffset => {
              return this.playlistProxy.updatePlaylistIdsPositionAsync(plIdIndexesToOffset, issuer);
            });
        }
      });
  }

  private getMediaIdIndexToUpdateForReorderAsync(playlistId, mediaIndex, issuer) {
    return this.playlistProxy
      .getMediaIdsLowerThanAsync(playlistId, mediaIndex, false, issuer)
      .then(mediaIdsLower => {
        return {lowerIds: mediaIdsLower, lowestIndex: mediaIndex};
      });
  }

  private reorderLowerMedia(mediaIdsLowerSet, mediaIdToRemove, issuer) {
    const index = mediaIdsLowerSet.lowestIndex;

    const mediaIdsReordered = mediaIdsLowerSet.lowerIds
      .filter(lowerId => {
        // Only increment playlists not to be deleted
        return mediaIdToRemove !== String(lowerId);
      })
      .map(lowerId => {
        return {_id: lowerId, index: index++};
      })
      .toArray();

    return this.mediaRepository.updateMediaIndexByIdsAsync(mediaIdsReordered, issuer);
  }

  private innerFeedPhysicalPlaylistWithMediaAndSaveAsync(emptyPlaylist, issuer) {
    return this.loadMediaFromPhysicalPlaylistAsync(emptyPlaylist, issuer) // Should give new Pl with media not yet persisted
      .then(media => this.saveMediaAsync(media))
      .then(media => {
        return this.playlistProxy.insertMediaToPlaylistReturnSelfAsync(
          emptyPlaylist.id,
          media,
          issuer
        );
      });
  }

  private loadMediaFromPhysicalPlaylistAsync(emptyPlaylist, issuer) {
    if (!emptyPlaylist) {
      throw new Error('PlaylistDirector.injectMediaToPhysicalPlaylistAsync: playlist must be set');
    }

    var filePath = emptyPlaylist.filePath;
    if (!filePath) {
      throw new Error('PlaylistDirector.injectMediaToPhysicalPlaylistAsync: playlist.FilePath must be set');
    }

    var physicalPlaylistService = this.findPhysicalPlaylistServiceFor(filePath);
    if (!physicalPlaylistService) {
      throw new Error('PlaylistDirector.injectMediaToPhysicalPlaylistAsync cannot load playlist of format: ' + fs.extname(filePath));
    }

    var plId = emptyPlaylist.id;
    return physicalPlaylistService
      .loadMediaSummariesFromPlaylistAsync(filePath)
      .then(ms => {
        return this.mediaBuilder.toMediaAsync(ms, plId, issuer);
      });
  }

  private findPhysicalPlaylistServiceFor(plFilePath) {
    return [this.physicalPlaylistServices]
      .find(svc => {
        return svc.isOfType(plFilePath);
      });
  }

  private assertOnNotFound(data) {
    if (data === undefined || data === null) {
      throw new Error('No data has been found');
    }
    return data;
  }
}
