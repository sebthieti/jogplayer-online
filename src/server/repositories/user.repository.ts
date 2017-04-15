import {IMongoDbContext} from './mongoDb.context';
import {User} from '../entities/user';
import {ObjectID} from 'mongodb';

export interface IUserRepository {
  isRootUserSetAsync(): Promise<boolean>;
  getUsersAsync(): Promise<User[]>;
  getUserByIdAsync(userId: ObjectID): Promise<User>;
  getUserByUsernameAsync(username: string): Promise<User>;
  addUserAsync(user: User): Promise<User>;
  updateUserAsync(userId: ObjectID, user: User): Promise<User>;
  removeUserByIdAsync(userId: ObjectID): Promise<void>;
}

export default class UserRepository implements IUserRepository {
  constructor(private dbContext: IMongoDbContext) {
  }

  async isRootUserSetAsync(): Promise<boolean> {
    const user: User = await this.dbContext.users.findOne(
      { 'permissions.isRoot': true },
      { fields: { 'permissions.isRoot': 1 } }
    );
    return user && user.permissions.isRoot;
  }

  getUsersAsync(): Promise<User[]> {
    return this.dbContext.users
      .find({}, {
        isActive: 1,
        isRoot: 1,
        username: 1,
        hashedPassword: 1,
        passwordSalt: 1,
        fullName: 1,
        role: 1,
        email: 1
      })
      .toArray();
  }

  getUserByIdAsync(userId: ObjectID): Promise<User> {
    return this.dbContext.users
      .findOne({ _id: userId });
  }

  getUserByUsernameAsync(username: string): Promise<User> {
    return this.dbContext.users
      .findOne({ username: username });
  }

  async addUserAsync(user: User): Promise<User> {
    if (!user) {
      throw new Error('user must be set');
    }

    const result = await this.dbContext.users.insertOne(user);
    return result.ops[0] as User;
  }

  async updateUserAsync(userId: ObjectID, user: User): Promise<User> {
    if (!user) {
      throw new Error('user must be set');
    }

    const updatedUser = await this.dbContext.users.findOneAndUpdate(
      { _id: user._id },
      user,
      { returnOriginal: false }
    );

    return updatedUser.value as User;
  }

  async removeUserByIdAsync(userId: ObjectID): Promise<void> {
    if (!userId) {
      throw new Error('userId must be set');
    }

    await this.dbContext.users.findOneAndDelete({ _id: userId });
  }
}
