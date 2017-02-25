import {IUserRepository} from '../repositories/user.repository';
import UserPermissionsModel from '../models/userPermissions.model';

export interface IUserPermissionsDirector {
  getUserPermissions(userId, issuer);
  addRootUserPermissionsAsync();
  addUserPermissionsAsync(permissionsDto, issuer);
  updateFromUserDtoAsync(userId, userDto, issuer);
  removeUserByIdAsync(userId, issuer);
}

export default class UserPermissionsDirector implements IUserPermissionsDirector {
  constructor(private userRepository: IUserRepository) {
  }

  // TODO Check for rights before doing (directory should do not service layer)
  getUserPermissions(userId, issuer) {
    if (issuer.role !== 'admin') {
      throw new Error('Not authorized no manage users.');
    }
    return this.userRepository.getUsersAsync();
  }

  addRootUserPermissionsAsync() {//userId, allowedPaths
    const userPermissionsModel = new UserPermissionsModel({isRoot: true});

    return userPermissionsModel.save(); // _userPermissionsProxy.addUserAsync(user, issuer);
  }

  addUserPermissionsAsync(permissionsDto, issuer) {//userId, allowedPaths
    if (!issuer.permissions.isRoot && !issuer.permissions.isAdmin) { // TODO Use role or isAdmin ? There is redundancy
      throw new Error('Not authorized no manage users.');
    }
    const userPermissionsModel = new UserPermissionsModel(permissionsDto);

    return userPermissionsModel.save(); // _userPermissionsProxy.addUserAsync(user, issuer);
  }

  updateFromUserDtoAsync(userId, userDto, issuer) {
    if (!issuer.permissions.isRoot && !issuer.permissions.isAdmin) {
      throw new Error('Not authorized no manage users.');
    }
    return this.userRepository.updateFromUserDtoAsync(userId, userDto, issuer);
  }

  removeUserByIdAsync(userId, issuer) {
    if (!issuer.permissions.isRoot && !issuer.permissions.isAdmin) {
      throw new Error('Not authorized no manage users.');
    }

    return this.userRepository
      .getUserByIdWithPermissionsAsync(userId)
      .then(user => {
        if (user.isRoot === true) {
          throw new Error('Root user cannot be removed.');
        }
        return this.userRepository.removeUserByIdAsync(user, issuer);
      });
  }
}
