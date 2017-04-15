import {ObjectID} from 'mongodb';
import {IMongoDbContext} from './mongoDb.context';
import {UserState} from '../entities/userState';

export interface IUserStateRepository {
  updateAsync(userState: UserState, issuerId: ObjectID): Promise<UserState>;
}

export default class UserStateRepository implements IUserStateRepository {
  constructor(private dbContext: IMongoDbContext) {
  }

  async updateAsync(userState: UserState, issuerId: ObjectID): Promise<UserState> {
    if (!issuerId) {
      throw new Error('issuerId must be set');
    }
    if (!userState) {
      throw new Error('userStateRequest must be set');
    }

    const result = await this.dbContext.users.findOneAndUpdate(
      { _id: issuerId },
      { $set: { state: userState }},
      { projection: { state: 1 }, returnOriginal: false }
    );

    return result.value.state;
  }
}
