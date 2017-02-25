import * as mongoose from 'mongoose';
import * as ReadWriteLock from 'rwlock';
import {IMediaModel} from '../models/media.model';
const lock = new ReadWriteLock();

export interface IMediaRepository {
  getMediaByIdAsync(mediaId, issuer): Promise<mongoose.Schema>;
  getMediumByIdAndPlaylistIdAsync(playlistId, mediumId, issuer): Promise<mongoose.Schema>;
  findIndexFromMediaIdsAsync(mediaId, issuer): Promise<mongoose.Schema>;
  updateMediaIndexByIdsAsync(mediaIdIndexesToOffset, issuer): Promise<mongoose.Schema>;
  updateMediaIndexByIdAsync(mediaId, newIndex, issuer): Promise<mongoose.Schema>;
  removeMediaAsync(media, issuer): Promise<mongoose.Schema[]>;
  removeMediumAsync(medium, issuer): Promise<mongoose.Schema>;
  removeMediumByIdAsync(mediumId);
}

export default class MediaRepository implements IMediaRepository {
  private Media: IMediaModel;

  constructor(mediaModel: IMediaModel) {
    this.Media = mediaModel;
  }

  getMediaByIdAsync(mediaId, issuer): Promise<mongoose.Schema> {
    return new Promise((resolve, reject) => {
      this.Media.findOne({
        _id: mediaId,
        ownerId: issuer.id
      }, (err, media) => {
        if (!err) {
          resolve(media);
        } else {
          reject(err);
        }
      });
    });
  }

  getMediumByIdAndPlaylistIdAsync(playlistId, mediumId, issuer): Promise<mongoose.Schema> {
    return new Promise((resolve, reject) => {
      this.Media.findOne({
        _id: mediumId,
        _playlistId: playlistId,
        ownerId: issuer.id
      }, (err, media) => {
        if (!err) {
          resolve(media);
        } else {
          reject(err);
        }
      });
    });
  }

  findIndexFromMediaIdsAsync(mediaId, issuer): Promise<mongoose.Schema> {
    return new Promise((resolve, reject) => {
      this.Media
        .findOne({ _id: mediaId, ownerId: issuer.id })
        .select('index')
        .exec((err, medium) => {
          if (err) {
            reject(err);
          } else {
            resolve(medium.index);
          }
        });
    });
  }

  updateMediaIndexByIdsAsync(mediaIdIndexesToOffset, issuer): Promise<mongoose.Schema> {
    return new Promise((resolve, reject) => {
      if (lock.writeLock(release => {
        const updateMediaIdIndexPromises = mediaIdIndexesToOffset.map(value =>
          this.updateMediaIndexByIdAsync(value._id, value.index, issuer)
        );
        return Promise.all(updateMediaIdIndexPromises)
          .then(() => release());
      })) {}
    });
  }

  updateMediaIndexByIdAsync(mediaId, newIndex, issuer): Promise<mongoose.Schema> {
    return new Promise((resolve, reject) => {
      this.Media
        .findOne({_id: mediaId, ownerId: issuer.id})
        .select('index')
        .exec((readError, medium) => {
          if (readError) {
            reject(readError);
          } else {
            medium.index = newIndex;
            medium.save((writeError, updatedMedium) => {
              if (writeError) {
                reject(writeError);
              } else {
                resolve(updatedMedium);
              }
            });
          }
        });
    });
  }

  removeMediaAsync(media, issuer): Promise<mongoose.Schema[]> {
    const removeMediumPromises = media.map(medium =>
      this.removeMediumAsync(medium, issuer)
    );
    return Promise.all(removeMediumPromises);
  }

  removeMediumAsync(medium, issuer): Promise<mongoose.Schema> {
    return new Promise((resolve, reject) => {
      medium.remove((err, medium) => {
        if (!err) {
          resolve(medium);
        } else {
          reject(err);
        }
      });
    });
  };

  removeMediumByIdAsync(mediumId) {
    return new Promise((resolve, reject) => {
      this.Media.findOneAndRemove(
        { _id: mediumId },
        (err, medium) => {
          if (!err) {
            resolve(medium);
          } else {
            reject(err);
          }
        }
      );
    });
  }
}
