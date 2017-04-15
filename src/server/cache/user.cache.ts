import {IUserModel} from '../models/user.model';
import {ICache} from './cache';

export interface IUserCache {
  getUserByIdAsync(userId: string, factory: (userId: string) => Promise<IUserModel>): Promise<IUserModel>;
  getUserByUsernameAsync(userName: string, factory: (userName: string) => Promise<IUserModel>): Promise<IUserModel>;
  registerUser(user: IUserModel): IUserModel;
  removeUserByIdAsync(userId: string): Promise<void>;
  invalidateUsers();
}

export default class UserCache implements IUserCache {
  private USERS_BY_NAME = 'users.name';
  private USERS_BY_ID = 'users.id';

  constructor(private cache: ICache) {}

  async getUserByIdAsync(
    userId: string,
    factory?: (userId: string) => Promise<IUserModel>
  ): Promise<IUserModel> {
    const userFromCache = this.cache.getItemFromCache<IUserModel>(
      this.USERS_BY_ID,
      userId
    );
    if (userFromCache != null) {
      return userFromCache;
    } else if (factory) {
      const user = await factory(userId);
      this.cache.upsertItem(this.USERS_BY_NAME, user.username, user);
      this.cache.upsertItem(this.USERS_BY_ID, userId, user);
      return user;
    }
  }

  async getUserByUsernameAsync(
    userName: string,
    factory?: (userName: string) => Promise<IUserModel>
  ): Promise<IUserModel> {
    const userFromCache = this.cache.getItemFromCache<IUserModel>(
      this.USERS_BY_NAME,
      userName
    );
    if (userFromCache != null) {
      return userFromCache;
    } else if (factory) {
      const user = await factory(userName);
      this.cache.upsertItem(this.USERS_BY_NAME, userName, user);
      this.cache.upsertItem(this.USERS_BY_ID, user.id, user);
      return user;
    }
  }

  registerUser(user: IUserModel): IUserModel {
    this.cache.upsertItem(this.USERS_BY_ID, user.id, user);
    this.cache.upsertItem(this.USERS_BY_NAME, user.username, user);

    return user;
  }

  async removeUserByIdAsync(userId: string): Promise<void> {
    const user = await this.getUserByIdAsync(userId);

    this.cache.removeItem(this.USERS_BY_ID, user.id);
    this.cache.removeItem(this.USERS_BY_NAME, user.username);
  }

  invalidateUsers() {
    this.cache.removeItemsInGroup(this.USERS_BY_ID);
    this.cache.removeItemsInGroup(this.USERS_BY_NAME);
  }
}
