import {IMongoDbContext} from './mongoDb.context';
import {ObjectID} from 'mongodb';
import {UserPermissions} from '../entities/userPermissions';

export interface IUserPermissionsRepository {
  updateAsync(userId: ObjectID, permissions: UserPermissions): Promise<UserPermissions>;
}

export default class UserPermissionsRepository implements IUserPermissionsRepository {
  constructor(private dbContext: IMongoDbContext) {
  }

  async updateAsync(userId: ObjectID, permissions: UserPermissions): Promise<UserPermissions> {
    if (!permissions) {
      throw new Error('permissions must be set');
    }

    const result = await this.dbContext.users.findOneAndUpdate(
      { _id: userId },
      { $set: { permissions: permissions }},
      { projection: { permissions: 1 }, returnOriginal: false }
    );

    return result.value.permissions as UserPermissions;
  };
}
