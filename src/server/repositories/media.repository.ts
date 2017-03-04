import * as ReadWriteLock from 'rwlock';
import {IMediumModel, Medium} from '../models/medium.model';
import {User} from '../models/user.model';
const lock = new ReadWriteLock();

export interface IMediaRepository {
  getMediaByIdAsync(mediaId: string, issuer: User): Promise<Medium>;
  getMediumByIdAndPlaylistIdAsync(
    playlistId: string,
    mediumId: string,
    issuer: User
  ): Promise<Medium>;
  findIndexFromMediaIdsAsync(mediaId: string, issuer: User): Promise<number>;
  updateMediaIndexByIdsAsync(
    mediaIdIndexesToOffset: {_id: string, index: number}[],
    issuer: User
  ): Promise<void>;
  updateMediaIndexByIdAsync(mediaId: string, newIndex: number, issuer: User): Promise<Medium>;
  removeMediaAsync(medium: Medium[], issuer: User): Promise<Medium[]>;
  removeMediumAsync(medium: Medium, issuer: User): Promise<Medium>;
  removeMediumByIdAsync(mediumId: string): Promise<Medium>;
}

export default class MediaRepository implements IMediaRepository {
  private Media: IMediumModel;

  constructor(mediaModel: IMediumModel) {
    this.Media = mediaModel;
  }

  async getMediaByIdAsync(mediaId: string, issuer: User): Promise<Medium> {
    return await this.Media.findOne({ _id: mediaId, ownerId: issuer.id });
  }

  async getMediumByIdAndPlaylistIdAsync(
    playlistId: string,
    mediumId: string,
    issuer: User
  ): Promise<Medium> {
    return await this.Media.findOne({
      _id: mediumId,
      _playlistId: playlistId,
      ownerId: issuer.id
    });
  }

  async findIndexFromMediaIdsAsync(mediaId: string, issuer: User): Promise<number> {
    const medium = await this.Media
      .findOne({ _id: mediaId, ownerId: issuer.id })
      .select('index')
      .exec();

    return medium.index;
  }

  async updateMediaIndexByIdsAsync(
    mediaIdIndexesToOffset: {_id: string, index: number}[],
    issuer: User
  ): Promise<void> {
    const uow = async release => {
      const updateMediaIdIndexPromises = mediaIdIndexesToOffset.map(value =>
        this.updateMediaIndexByIdAsync(value._id, value.index, issuer)
      );
      await Promise.all(updateMediaIdIndexPromises);
      release();
    };

    if (lock.writeLock(uow)) {
    }
  }

  async updateMediaIndexByIdAsync(mediaId: string, newIndex: number, issuer: User): Promise<Medium> {
    const medium = await this.Media
      .findOne({_id: mediaId, ownerId: issuer.id})
      .select('index');

    medium.index = newIndex;
    return await medium.save();
  }

  removeMediaAsync(medium: Medium[], issuer: User): Promise<Medium[]> {
    const removeMediumPromises = medium.map(medium =>
      this.removeMediumAsync(medium, issuer)
    );
    return Promise.all(removeMediumPromises);
  }

  async removeMediumAsync(medium: Medium, issuer: User): Promise<Medium> {
    return await medium.remove();
  };

   async removeMediumByIdAsync(mediumId: string): Promise<Medium> { // TODO All remove method shall not return updated entity
    return await this.Media.findOneAndRemove({ _id: mediumId });
  }
}
