import * as mongoose from 'mongoose';
import * as ReadWriteLock from 'rwlock';
const lock = new ReadWriteLock();
import {IMediaRepository} from './media.repository';
import {IPlaylistModel} from '../models/playlist.model';

export interface IPlaylistRepository {
  getPlaylistsAsync(issuer): Promise<mongoose.Schema>;
  getPlaylistWithMediaAsync(playlistId: string, issuer): Promise<mongoose.Schema>;
  getPlaylistsCountAsync(issuer);
  getPlaylistIdsLowerThanAsync(index, includeSelf, issuer);
  getMediaIdsLowerThanAsync (playlistId, mediaIndex, includeSelf, issuer);
  getMediaCountForPlaylistByIdAsync (playlistId, issuer);
  findIndexFromPlaylistIdAsync(playlistId, issuer);
  getPlaylistIdIndexesAsync (issuer);
  findIndexesFromPlaylistIdsAsync(playlistIds, issuer);
  insertMediumToPlaylistAsync(playlistId, medium, issuer);
  insertMediaToPlaylistReturnSelfAsync(playlistId, mediaArray, issuer);
  updatePlaylistIdsPositionAsync(plIdIndexesToOffset, issuer);
  updatePlaylistIdPositionAsync(playlistId, newIndex, issuer);
  updatePlaylistDtoAsync(playlistId, playlistDto, issuer);
  removePlaylistByIdAsync(playlistId, issuer);
  removeMediaFromPlaylistAsync(playlistId, mediaId, issuer);
  removeAllMediaFromPlaylistAsync(playlistId, issuer);
}

export default class PlaylistRepository implements IPlaylistRepository {
  private Playlist: IPlaylistModel;

  constructor(playlistModel: IPlaylistModel, private mediaSaveService: IMediaRepository) {
    this.Playlist = playlistModel;
  }

  getPlaylistsAsync(issuer): Promise<mongoose.Schema> {
    return new Promise((resolve, reject) => {
      this.Playlist
        .find({ ownerId: issuer.id })
        .select('-media')
        .sort('index')
        .exec((err, playlists) => {
          if (!err) {
            resolve(playlists);
          } else {
            reject(err);
          }
        });
    });
  }

  getPlaylistWithMediaAsync(playlistId: string, issuer): Promise<mongoose.Schema> {
    return new Promise((resolve, reject) => {
      this.Playlist
        .findOne({ _id: playlistId, ownerId: issuer.id })
        .populate('media')
        .exec((err, playlist) => {
          if (!err) {
            resolve(playlist);
          } else {
            reject(err);
          }
        });
    });
  }

  getPlaylistsCountAsync(issuer) {
    return new Promise((resolve, reject) => {
      this.Playlist.count(
        { ownerId: issuer.id },
        (err, playlistCount) => {
          if (!err) {
            resolve(playlistCount);
          } else {
            reject(err);
          }
        }
      );
    });
  };

  getPlaylistIdsLowerThanAsync(index, includeSelf, issuer) {
    return new Promise((resolve, reject) => {
      const queryIndex = includeSelf ? index : index + 1;
      this.Playlist
        .find({ ownerId: issuer.id })
        .where('index').gte(queryIndex)
        .sort('index')
        .select('index')
        .exec((err, playlistIdIndexesSet) => {
          if (!err) {
            resolve(playlistIdIndexesSet);
          } else {
            reject(err);
          }
        });
    });
  }

  getMediaIdsLowerThanAsync(playlistId, mediaIndex, includeSelf, issuer) {
    return new Promise((resolve, reject) => {
      const queryIndex = includeSelf ? mediaIndex : mediaIndex + 1;
      this.Playlist
        .findOne({ _id: playlistId, ownerId: issuer.id })
        .populate({
          path: 'media',
          select: '_id',
          sort: 'index',
          match: { index: { $gte: queryIndex } }
        })
        .select('media')
        .exec((err, playlist) => {
          if (err) {
            reject(err);
          } else {
            resolve(playlist
              .media
              .map(medium => medium._id)
            );
          }
        });
    });
  }

  getMediaCountForPlaylistByIdAsync(playlistId, issuer) {
    return new Promise((resolve, reject) => {
      this.Playlist
        .findOne({ _id: playlistId, ownerId: issuer.id })
        .populate({
          path: 'media',
          select: '_id'
        })
        .exec((err, playlist) => {
          if (!err && playlist) {
            resolve(playlist.media.length);
          } else if (!playlist) {
            reject(`PlaylistId: ${playlistId} doesn't exists`);
          } else {
            reject(err);
          }
        });
    });
  }

  findIndexFromPlaylistIdAsync(playlistId, issuer) {
    return new Promise((resolve, reject) => {
      this.Playlist
        .findOne({ _id: playlistId, ownerId: issuer.id })
        .select('index')
        .exec((err, playlistIdIndex) => {
          if (err) {
            reject(err);
          } else {
            resolve(playlistIdIndex);
          }
        });
    });
  }

  getPlaylistIdIndexesAsync (issuer) {
    return this.findIndexesFromPlaylistIdsAsync(issuer);
  }

  findIndexesFromPlaylistIdsAsync(playlistIds, issuer) {
    return new Promise((resolve, reject) => {
      this.Playlist
        .find({ ownerId: issuer.id })
        .whereInOrGetAll('_id', playlistIds)
        .sort('index')
        .select('index')
        .exec((err, playlistIdIndexes) => {
          if (err) {
            reject(err);
          } else {
            resolve(playlistIdIndexes);
          }
        });
    });
  }

  insertMediumToPlaylistAsync(playlistId, medium, issuer) {
    return new Promise((resolve, reject) => {
      if (lock.writeLock((release) => {
        this.Playlist
          .findOne({_id: playlistId, ownerId: issuer.id})
          .populate({path: 'media', select: '_id'})
          .exec((readError, playlist) => {
            if (readError) {
              reject(readError);
            } else if (!playlist) {
              reject(`PlaylistId: ${playlistId} doesn't exists`);
            } else {
              playlist.media = playlist.media.concat(medium);
              playlist.save((writeError) => {
                if (writeError) {
                  reject(writeError);
                } else {
                  resolve(medium);
                  release();
                }
              });
            }
          });
        })) {}
    });
  }

  insertMediaToPlaylistReturnSelfAsync(playlistId, mediaArray, issuer) {
    return new Promise((resolve, reject) => {
      this.Playlist
        .findOne({ _id: playlistId, ownerId: issuer.id })
        .populate({ path: 'media', select: '_id' })
        .exec((readError, playlist) => {
          if (readError) {
            reject(readError);
          } else {
            playlist.media = playlist.media.concat(mediaArray);
            playlist.save((writeError, savedPlaylist) => {
              if (writeError) {
                reject(writeError);
              } else {
                resolve(savedPlaylist);
              }
            });
          }
        });
    });
  }

  updatePlaylistIdsPositionAsync(plIdIndexesToOffset, issuer) {
    const updatePlaylistIdPositionPromises = plIdIndexesToOffset.map(value =>
      this.updatePlaylistIdPositionAsync(value._id, value.index, issuer)
    );
    return Promise.all(updatePlaylistIdPositionPromises);
  }

  updatePlaylistIdPositionAsync(playlistId, newIndex, issuer) {
    return new Promise((resolve, reject) => {
      this.Playlist
        .findOne({ _id: playlistId, ownerId: issuer.id })
        .select('index')
        .exec((readError, playlist) => {
          if (readError) {
            reject(readError);
          } else {
            playlist.index = newIndex;
            playlist.save((writeError, updatedPlaylist) => {
              if (writeError) {
                reject(writeError);
              } else {
                resolve(updatedPlaylist);
              }
            });
          }
        });
    });
  }

  updatePlaylistDtoAsync(playlistId, playlistDto, issuer) {
    return new Promise((resolve, reject) => {
      this.Playlist
        .findOneAndUpdate(
          { _id: playlistId, ownerId: issuer.id },
          playlistDto.getDefinedFields(),
          { 'new': true } // Return modified doc.
        )
        .populate('media')
        .exec((err, playlist) => {
            if (!err) {
              resolve(playlist);
            } else {
              reject(err);
            }
        });
    });
  }

  removePlaylistByIdAsync(playlistId, issuer) {
    return new Promise((resolve, reject) => {
      this.Playlist
        .findOne({ _id: playlistId, ownerId: issuer.id })
        .populate({ path: 'media', select: '_id' })
        .exec((err, playlist) => {
          if (err) {
            reject(err);
          } else {
            const removePromises = playlist.media.map(medium =>
              this.mediaSaveService.removeMediumAsync(medium)
            );

            Promise.all(removePromises)
              .then(() => {
                playlist.remove((removeError, removedPlaylist) => {
                  if (!err) {
                    resolve(removedPlaylist);
                  } else {
                    reject(err);
                  }
                });
              })
              .catch(removeMediaError => {
                reject(removeMediaError);
              });
          }
        });
    });
  }

  removeMediaFromPlaylistAsync(playlistId, mediaId, issuer) {
    return new Promise((resolve, reject) => {
      this.Playlist
        .findOne({ _id: playlistId, ownerId: issuer.id })
        .populate('media')
        .exec((err, playlist) => {
          if (err) {
            reject(err);
          } else {
            this.mediaSaveService
              .removeMediumByIdAsync(mediaId)
              .then(() => {
                playlist.media = playlist.media.filter(medium => {
                  return String(medium._id) !== mediaId;
                });
                playlist.save((saveError, savedPlaylist) => {
                  if (!err) {
                    resolve(savedPlaylist);
                  } else {
                    reject(saveError);
                  }
                });
              });
          }
        });
    });
  }

  removeAllMediaFromPlaylistAsync(playlistId, issuer) {
    return new Promise((resolve, reject) => {
      this.Playlist
        .findOne({ _id: playlistId, ownerId: issuer.id })
        .populate({
          path: 'media',
          select: '_id'
        })
        .exec((err, playlist) => {
          if (err) {
            reject(err);
          } else {
            this.mediaSaveService
              .removeMediaAsync(playlist.media)
              .then(() => {
                playlist.media = [];
                playlist.save((saveError, savedPlaylist) => {
                  if (!err) {
                    resolve(savedPlaylist);
                  } else {
                    reject(saveError);
                  }
                });
              });
          }
        });
    });
  }
}
