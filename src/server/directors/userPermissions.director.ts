import {IUserRepository} from '../repositories/user.repository';
import UserPermissionsModel from '../models/userPermissions.model';
import {User} from '../models/user.model';
import {UserPermissions} from '../models/userPermissions.model';
import {IUserDto} from '../dto/user.dto';

export interface IUserPermissionsDirector {
  getUserPermissions(userId: string, issuer: User): Promise<User[]>;
  addRootUserPermissionsAsync(): Promise<UserPermissions>;
  addUserPermissionsAsync(permissionsDto: UserPermissions, issuer: User): Promise<UserPermissions>;
  updateFromUserDtoAsync(userId: string, userDto: IUserDto, issuer: User): Promise<User>;
  removeUserByIdAsync(userId: string, issuer: User): Promise<void>;
}

export default class UserPermissionsDirector implements IUserPermissionsDirector {
  constructor(private userRepository: IUserRepository) {
  }

  // TODO Check for rights before doing (directory should do not service layer)
  getUserPermissions(userId: string, issuer: User): Promise<User[]> {
    if (issuer.role !== 'admin') {
      throw new Error('Not authorized no manage users.');
    }
    return this.userRepository.getUsersAsync();
  }

  addRootUserPermissionsAsync(): Promise<UserPermissions> {//userId, allowedPaths
    const userPermissionsModel = new UserPermissionsModel({isRoot: true});

    return userPermissionsModel.save(); // _userPermissionsProxy.addUserAsync(user, issuer);
  }

  addUserPermissionsAsync(permissionsDto: UserPermissions, issuer: User): Promise<UserPermissions> {//userId, allowedPaths
    if (!issuer.permissions.isRoot && !issuer.permissions.isAdmin) { // TODO Use role or isAdmin ? There is redundancy
      throw new Error('Not authorized no manage users.');
    }
    const userPermissionsModel = new UserPermissionsModel(permissionsDto);

    return userPermissionsModel.save(); // _userPermissionsProxy.addUserAsync(user, issuer);
  }

  updateFromUserDtoAsync(userId: string, userDto: IUserDto, issuer: User): Promise<User> {
    if (!issuer.permissions.isRoot && !issuer.permissions.isAdmin) {
      throw new Error('Not authorized no manage users.');
    }
    return this.userRepository.updateFromUserDtoAsync(userId, userDto, issuer);
  }

  async removeUserByIdAsync(userId: string, issuer: User): Promise<void> {
    if (!issuer.permissions.isRoot && !issuer.permissions.isAdmin) {
      throw new Error('Not authorized no manage users.');
    }

    const user = await this.userRepository
      .getUserByIdWithPermissionsAsync(userId);

    if (user.isRoot === true) {
      throw new Error('Root user cannot be removed.');
    }
    return this.userRepository.removeUserByIdAsync(user.id, issuer);
  }
}
