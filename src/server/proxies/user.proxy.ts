import {ICache} from './cache';
import {IEvents} from '../events/index';
import {IUserRepository} from '../repositories/user.repository';

export interface IUserProxy {
  getUserByUsernameWithPermissionsAsync(username);
  getUserByIdWithPermissionsAsync(userId);
  addUserPermissionsAsync(userId, userPermissionsModel, issuer);
  addRootUserAsync(rootUserDto, userPermissionsModel);
  addUserAsync(userDto, userPermissionsModel, issuer);
  updateFromUserDtoAsync(userId, userDto, issuer);
  isRootUserSetAsync();
  removeUserByIdAsync(userId, issuer);
  invalidateUsers();
  getUsersAsync();
}

export default class UserProxy implements IUserProxy {
  private USERS_BY_NAME = 'users.name';
  private USERS_BY_ID = 'users.id';

  constructor(
    private cache: ICache,
    private events: IEvents,
    private userSaveService: IUserRepository
  ) {}

  getUserByUsernameWithPermissionsAsync(username) {
    const userFromCache = this.cache.getItemFromCache(
      this.USERS_BY_NAME,
      username
    );
    if (userFromCache != null) {
      return Promise.resolve(userFromCache);
    } else {
      return this.userSaveService
        .getUserByUsernameWithPermissionsAsync(username)
        .then(user => {
          this.cache.createOrUpdateItem(
            this.USERS_BY_NAME,
            username,
            user
          );
          return user;
        });
    }
  }

  getUserByIdWithPermissionsAsync(userId) {
    const userFromCache = this.cache.getItemFromCache(
      this.USERS_BY_ID,
      userId
    );
    if (userFromCache != null) {
      return Promise.resolve(userFromCache);
    } else {
      return this.userSaveService
        .getUserByIdWithPermissionsAsync(userId)
        .then(user => {
          this.cache.createOrUpdateItem(
            this.USERS_BY_ID,
            userId,
            user
          );
          return user;
        });
    }
  }

  addUserPermissionsAsync(userId, userPermissionsModel, issuer) {
    return this.userSaveService
      .addUserPermissionsAsync(userId, userPermissionsModel, issuer)
      .then(userPermissionsModel => {
        this.invalidateUsers();
        return userPermissionsModel;
      });
  }

  addRootUserAsync(rootUserDto, userPermissionsModel) {
    return this.userSaveService
      .addRootUserAsync(rootUserDto, userPermissionsModel)
      .then(user => {
        return this.userSaveService.getUserByIdWithPermissionsAsync(user.id);
      })
      .then(user => {
        this.cache.createOrUpdateItem(this.USERS_BY_ID, user.id, user);
        this.cache.createOrUpdateItem(this.USERS_BY_NAME, user.username, user);
        return user;
      });
  }

  addUserAsync(userDto, userPermissionsModel, issuer) {
    return this.userSaveService
      .addUserAsync(userDto, userPermissionsModel, issuer)
      .then(user => {
        return this.userSaveService.getUserByIdWithPermissionsAsync(user.id);
      })
      .then(user => {
        this.cache.createOrUpdateItem(this.USERS_BY_ID, user.id, user);
        this.cache.createOrUpdateItem(this.USERS_BY_NAME, user.username, user);
        return user;
      });
  }

  updateFromUserDtoAsync(userId, userDto, issuer) {
    return this.userSaveService
      .updateFromUserDtoAsync(userId, userDto, issuer)
      .then(user => {
        return this.userSaveService.getUserByIdWithPermissionsAsync(user.id);
      })
      .then(user => {
        this.cache.createOrUpdateItem(this.USERS_BY_ID, user.id, user);
        this.cache.createOrUpdateItem(this.USERS_BY_NAME, user.username, user);
        return user;
      });
  }

  isRootUserSetAsync() {
    return this.userSaveService.isRootUserSetAsync();
  }

  removeUserByIdAsync(userId, issuer) {
    return this.userSaveService
      .removeUserByIdAsync(userId, issuer)
      .then(() => {
        return this.invalidateUsers();
      });
  }

  invalidateUsers() {
    this.cache.removeItemsInGroup(this.USERS_BY_ID);
    this.cache.removeItemsInGroup(this.USERS_BY_NAME);
  }

  getUsersAsync() {
    return this.userSaveService.getUsersAsync();
  }
}
