import {ICache} from './cache';
import {IEvents} from '../events/index';
import {IUserRepository} from '../repositories/user.repository';
import {User} from '../models/user.model';
import {UserPermissions, IUserPermissionsModel} from '../models/userPermissions.model';
import UserDto from '../dto/user.dto';

export interface IUserProxy {
  getUserByUsernameWithPermissionsAsync(username: string): Promise<User>;
  getUserByIdWithPermissionsAsync(userId: string): Promise<User>;
  addUserPermissionsAsync(
    userId: string,
    userPermissionsModel: UserPermissions[],
    issuer: User
  ): Promise<UserPermissions[]>;
  addRootUserAsync(rootUserDto: UserDto, userPermissionsModel: IUserPermissionsModel): Promise<User>;
  addUserAsync(
    userDto: UserDto,
    userPermissionsModel: IUserPermissionsModel,
    issuer: User
  ): Promise<User>;
  updateFromUserDtoAsync(userId: string, userDto: UserDto, issuer: User): Promise<User>;
  isRootUserSetAsync(): Promise<boolean>;
  removeUserByIdAsync(userId: string, issuer: User): Promise<void>;
  invalidateUsers();
  getUsersAsync(): Promise<User[]>;
}

export default class UserProxy implements IUserProxy {
  private USERS_BY_NAME = 'users.name';
  private USERS_BY_ID = 'users.id';

  constructor(
    private cache: ICache,
    private events: IEvents,
    private userSaveService: IUserRepository
  ) {}

  async getUserByUsernameWithPermissionsAsync(username: string): Promise<User> {
    const userFromCache = this.cache.getItemFromCache<User>(
      this.USERS_BY_NAME,
      username
    );
    if (userFromCache != null) {
      return userFromCache;
    } else {
      const user = await this.userSaveService
        .getUserByUsernameWithPermissionsAsync(username);

      this.cache.createOrUpdateItem(
        this.USERS_BY_NAME,
        username,
        user
      );
      return user;
    }
  }

  async getUserByIdWithPermissionsAsync(userId: string): Promise<User> {
    const userFromCache = this.cache.getItemFromCache<User>(
      this.USERS_BY_ID,
      userId
    );
    if (userFromCache != null) {
      return userFromCache;
    } else {
      const user = await this.userSaveService
        .getUserByIdWithPermissionsAsync(userId);

      this.cache.createOrUpdateItem(
        this.USERS_BY_ID,
        userId,
        user
      );
      return user;
    }
  }

  async addUserPermissionsAsync(
    userId: string,
    userPermissionsModel: UserPermissions[],
    issuer: User
  ): Promise<UserPermissions[]> {
    const addedUserPermissionsModel = await this.userSaveService
      .addUserPermissionsAsync(userId, userPermissionsModel, issuer);

    this.invalidateUsers();
    return addedUserPermissionsModel;
  }

  async addRootUserAsync(
    rootUserDto: UserDto,
    userPermissionsModel: IUserPermissionsModel
  ): Promise<User> {
    let user = await this.userSaveService.addRootUserAsync(rootUserDto, userPermissionsModel);
    user = await this.userSaveService.getUserByIdWithPermissionsAsync(user.id);

    this.cache.createOrUpdateItem(this.USERS_BY_ID, user.id, user);
    this.cache.createOrUpdateItem(this.USERS_BY_NAME, user.username, user);

    return user;
  }

  async addUserAsync(
    userDto: UserDto,
    userPermissionsModel: IUserPermissionsModel,
    issuer: User
  ): Promise<User> {
    let user = await this.userSaveService.addUserAsync(
      userDto,
      userPermissionsModel,
      issuer
    );
    user = await this.userSaveService.getUserByIdWithPermissionsAsync(user.id);

    this.cache.createOrUpdateItem(this.USERS_BY_ID, user.id, user);
    this.cache.createOrUpdateItem(this.USERS_BY_NAME, user.username, user);
    return user;
  }

  async updateFromUserDtoAsync(userId: string, userDto: UserDto, issuer: User): Promise<User> {
    let user = await this.userSaveService
      .updateFromUserDtoAsync(userId, userDto, issuer);
    user = await this.userSaveService.getUserByIdWithPermissionsAsync(user.id);

    this.cache.createOrUpdateItem(this.USERS_BY_ID, user.id, user);
    this.cache.createOrUpdateItem(this.USERS_BY_NAME, user.username, user);
    return user;
  }

  isRootUserSetAsync(): Promise<boolean> {
    return this.userSaveService.isRootUserSetAsync();
  }

  async removeUserByIdAsync(userId: string, issuer: User): Promise<void> {
    await this.userSaveService.removeUserByIdAsync(userId, issuer);
    this.invalidateUsers();
  }

  invalidateUsers() {
    this.cache.removeItemsInGroup(this.USERS_BY_ID);
    this.cache.removeItemsInGroup(this.USERS_BY_NAME);
  }

  getUsersAsync(): Promise<User[]> {
    return this.userSaveService.getUsersAsync();
  }
}
