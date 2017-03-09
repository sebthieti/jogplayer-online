import * as hasher from '../utils/hasher';
import {IUserProxy} from '../proxies/user.proxy';
import {IUserPermissionsDirector} from './userPermissions.director';
import {User} from '../models/user.model';
import {IUserDto} from '../dto/user.dto';
import {UserPermissions} from '../models/userPermissions.model';
import {IUserPermissionsDto} from '../dto/userPermissions.dto';

export interface IUserDirector {
  isRootUserSetAsync(): Promise<boolean>;
  getUsersAsync(issuer: User): Promise<User[]>;
  addRootUserAsync(rootUserDto: IUserDto): Promise<User>;
  addUserAsync(userDto: IUserDto, issuer: User): Promise<User>;
  addUserPermissionsAsync(userId: string, allowedPaths: string[], issuer: User): Promise<UserPermissions[]>;
  getUserPermissionsByUserId(userId: string, issuer: User): Promise<UserPermissions>;
  getAllUserPermissionsAsync(userId: string, allowedPaths: string[], issuer: User): Promise<User>;
  updateUserPermissionsByUserIdAsync(userId: string, userPermissionsDto: IUserPermissionsDto, issuer: User): Promise<UserPermissions>;
  updateFromUserDtoAsync(userId: string, userDto: IUserDto, issuer: User): Promise<User>;
  removeUserByIdAsync(userId: string, currentUser: User): Promise<void>;
}

export default class UserDirector implements IUserDirector {
  constructor(
    private userProxy: IUserProxy,
    private userPermissionsDirector: IUserPermissionsDirector) {
  }

  isRootUserSetAsync(): Promise<boolean> {
    return this.userProxy.isRootUserSetAsync();
  }

// TODO Check for rights before doing (directory should do not service layer)
  getUsersAsync(issuer: User): Promise<User[]> {
    if (!issuer.permissions.isRoot && !issuer.permissions.isAdmin) {
      throw new Error('Not authorized to manage users.');
    }
    return this.userProxy.getUsersAsync();
  }

  // TODO Refactor needed (use code from addUserAsync)
  async addRootUserAsync(rootUserDto: IUserDto): Promise<User> {
    // Generate password salt
    const passwordSalt = hasher.createSalt();
    const hashedPassword = hasher.computeHash(rootUserDto.password, passwordSalt);

    // TODO userDto s/not be altered
    rootUserDto.passwordSalt = passwordSalt;
    rootUserDto.password = hashedPassword; // TODO Rename in model to hashedPassword

    const userPermissionsModel = await this.userPermissionsDirector //_userPermissionsProxy
      .addRootUserPermissionsAsync();

    return this.userProxy.addRootUserAsync(rootUserDto, userPermissionsModel);
  }

  async addUserAsync(userDto: IUserDto, issuer: User): Promise<User> {
    if (!issuer.permissions.isRoot && !issuer.permissions.isAdmin) { // TODO Use role or isAdmin ? There is redundancy
      throw new Error('Not authorized to manage users.');
    }
    // Generate password salt
    const passwordSalt = hasher.createSalt();
    const hashedPassword = hasher.computeHash(userDto.password, passwordSalt);

    // TODO userDto s/not be altered
    userDto.passwordSalt = passwordSalt;
    userDto.password = hashedPassword; // TODO Rename in model to hashedPassword

    const userPermissionsModel = await this.userPermissionsDirector //_userPermissionsProxy
      .addUserPermissionsAsync(userDto.permissions, issuer);
    return this.userProxy.addUserAsync(userDto, userPermissionsModel, issuer);
  }

  async addUserPermissionsAsync(userId: string, allowedPaths: string[], issuer: User): Promise<UserPermissions[]> {
    if (!issuer.permissions.isRoot && !issuer.permissions.isAdmin) { // TODO Use role or isAdmin ? There is redundancy
      throw new Error('Not authorized to manage users.');
    }

    const userPermissionsModel = await this.userProxy //_userPermissionsProxy
      .addUserPermissionsAsync(userId, allowedPaths);

    return this.userProxy.addUserPermissionsAsync(userId, userPermissionsModel, issuer);
  }

  async getUserPermissionsByUserId(userId: string, issuer: User): Promise<UserPermissions> {
    if (!issuer.permissions.isRoot && !issuer.permissions.isAdmin) { // TODO Use role or isAdmin ? There is redundancy
      throw new Error('Not authorized to manage users.');
    }

    const userPermissionsModel = await this.userProxy
      .getUserByIdWithPermissionsAsync(userId);

    return userPermissionsModel.permissions;
  }

  getAllUserPermissionsAsync(userId: string, allowedPaths: string[], issuer: User): Promise<User> {
    if (!issuer.permissions.isRoot && !issuer.permissions.isAdmin) { // TODO Use role or isAdmin ? There is redundancy
      throw new Error('Not authorized to manage users.');
    }

    return this.userProxy.getUserByIdWithPermissionsAsync(userId);
    //_userPermissionsProxy.getAllUserPermissionsAsync();
  }

  async updateUserPermissionsByUserIdAsync(userId: string, userPermissionsDto: IUserPermissionsDto, issuer: User): Promise<UserPermissions> {
    //if (issuer.role !== 'admin') {
    //	throw 'Not authorized to manage users.';
    //}
    const userPermissionsModel = await this.userProxy
      .getUserByIdWithPermissionsAsync(userId);

    for (let key in userPermissionsDto) { // TODO Is there already some method to update instance model ?
      if (!userPermissionsDto.hasOwnProperty(key)) {
        continue;
      }
      userPermissionsModel.permissions[key] = userPermissionsDto[key];
    }
    return userPermissionsModel.permissions.save();
  }

  async updateFromUserDtoAsync(userId: string, userDto: IUserDto, issuer: User): Promise<User> {
    if (!issuer.permissions.isRoot && !issuer.permissions.isAdmin) {
      throw new Error('Not authorized to manage users.');
    }

    await this.updateUserPermissionsByUserIdAsync(userId, userDto.permissions, issuer);

    delete userDto.permissions;
    return this.userProxy.updateFromUserDtoAsync(userId, userDto, issuer);
  }

  async removeUserByIdAsync(userId: string, currentUser: User): Promise<void> {
    if (!currentUser.permissions.isRoot && !currentUser.permissions.isAdmin) {
      throw new Error('Not authorized to manage users.');
    }
    if (currentUser.id === userId) {
      throw new Error('Cannot remove yourself.');
    }

    const user = await this.userProxy
      .getUserByIdWithPermissionsAsync(userId);

    if (!user) {
      return;
    }
    if (user.isRoot === true) {
      throw new Error('Root user cannot be removed.');
    }
    return this.userProxy.removeUserByIdAsync(user.id, currentUser);
  }
}
