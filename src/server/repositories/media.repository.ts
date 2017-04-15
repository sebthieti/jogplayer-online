import {Medium} from '../entities/medium';
import {IMongoDbContext} from './mongoDb.context';
import {ObjectID} from 'mongodb';

export interface IMediaRepository {
  getMediumByIdAsync(mediumId: ObjectID): Promise<Medium>;
  addMediumAsync(medium: Medium): Promise<Medium>;
  updateMediumByIdAsync(mediumId: ObjectID, medium: Medium): Promise<Medium>;
  removeMediaAsync(mediumId: ObjectID[]): Promise<void>;
  removeMediumAsync(mediumId: ObjectID): Promise<void>;
  removeMediumByIdAsync(mediumId: ObjectID): Promise<void>;
}

export default class MediaRepository implements IMediaRepository {
  constructor(private dbContext: IMongoDbContext) {
  }

  getMediumByIdAsync(mediumId: ObjectID): Promise<Medium> {
    return this.dbContext.media.findOne({ _id: mediumId });
  }

  async addMediumAsync(medium: Medium): Promise<Medium> {
    const result = await this.dbContext.media.insertOne(medium);
    return result.ops[0] as Medium;
  }

  updateMediumByIdAsync(mediumId: ObjectID, medium: Medium): Promise<Medium> {
    return this.dbContext.media.findOneAndUpdate(
      { _id: mediumId },
      medium
    );
  }

  async removeMediaAsync(mediumId: ObjectID[]): Promise<void> {
    await this.dbContext.media.deleteMany({ _id: mediumId });
  }

  async removeMediumAsync(mediumId: ObjectID): Promise<void> {
    await this.dbContext.media.deleteOne({_id: mediumId});
  };

   async removeMediumByIdAsync(mediumId: ObjectID): Promise<void> { // TODO All remove method shall not return updated entity
     await this.dbContext.media.deleteOne({ _id: mediumId });
  }
}
