import * as hasher from '../utils/hasher';
import {IUserProxy} from '../proxies/user.proxy';
import {IUserPermissionsDirector} from './userPermissions.director';

export interface IUserDirector {
  isRootUserSetAsync();
  getUsersAsync(issuer);
  addRootUserAsync(rootUserDto);
  addUserAsync(userDto, issuer);
  addUserPermissionsAsync(userId, allowedPaths, issuer);
  getUserPermissionsByUserId(userId, issuer);
  getAllUserPermissionsAsync(userId, allowedPaths, issuer);
  updateUserPermissionsByUserIdAsync(userId, userPermissionsDto, issuer);
  updateFromUserDtoAsync(userId, userDto, issuer);
  removeUserByIdAsync(userId, currentUser);
}

export default class UserDirector implements IUserDirector {
  constructor(
    private userProxy: IUserProxy,
    private userPermissionsDirector: IUserPermissionsDirector
  ) {
  }

  isRootUserSetAsync() {
    return this.userProxy.isRootUserSetAsync();
  }

// TODO Check for rights before doing (directory should do not service layer)
  getUsersAsync(issuer) {
    if (!issuer.permissions.isRoot && !issuer.permissions.isAdmin) {
      throw new Error('Not authorized to manage users.');
    }
    return this.userProxy.getUsersAsync();
  }

  // TODO Refactor needed (use code from addUserAsync)
  addRootUserAsync(rootUserDto) {
    // Generate password salt
    const passwordSalt = hasher.createSalt();
    const hashedPassword = hasher.computeHash(rootUserDto.password, passwordSalt);

    // TODO userDto s/not be altered
    rootUserDto.passwordSalt = passwordSalt;
    rootUserDto.password = hashedPassword; // TODO Rename in model to hashedPassword

    return this.userPermissionsDirector //_userPermissionsProxy
      .addRootUserPermissionsAsync()
      .then(userPermissionsModel => {
        return this.userProxy.addRootUserAsync(rootUserDto, userPermissionsModel);
      });
  }

  addUserAsync(userDto, issuer) {
    if (!issuer.permissions.isRoot && !issuer.permissions.isAdmin) { // TODO Use role or isAdmin ? There is redundancy
      throw new Error('Not authorized to manage users.');
    }
    // Generate password salt
    const passwordSalt = hasher.createSalt();
    const hashedPassword = hasher.computeHash(userDto.password, passwordSalt);

    // TODO userDto s/not be altered
    userDto.passwordSalt = passwordSalt;
    userDto.password = hashedPassword; // TODO Rename in model to hashedPassword

    return this.userPermissionsDirector //_userPermissionsProxy
      .addUserPermissionsAsync(userDto.permissions, issuer)
      .then(userPermissionsModel => {
        return this.userProxy.addUserAsync(userDto, userPermissionsModel, issuer);
      });
  }

  addUserPermissionsAsync(userId, allowedPaths, issuer) {
    if (!issuer.permissions.isRoot && !issuer.permissions.isAdmin) { // TODO Use role or isAdmin ? There is redundancy
      throw new Error('Not authorized to manage users.');
    }

    return this.userProxy //_userPermissionsProxy
      .addUserPermissionsAsync(userId, allowedPaths)
      .then(userPermissionsModel => {
        return this.userProxy.addUserPermissionsAsync(userId, userPermissionsModel, issuer);
      });
  }

  getUserPermissionsByUserId(userId, issuer) {
    if (!issuer.permissions.isRoot && !issuer.permissions.isAdmin) { // TODO Use role or isAdmin ? There is redundancy
      throw new Error('Not authorized to manage users.');
    }

    return this.userProxy
      .getUserByIdWithPermissionsAsync(userId)
      .then(userPermissionsModel => {
        return userPermissionsModel.permissions;
      });
  }

  getAllUserPermissionsAsync(userId, allowedPaths, issuer) {
    if (!issuer.permissions.isRoot && !issuer.permissions.isAdmin) { // TODO Use role or isAdmin ? There is redundancy
      throw new Error('Not authorized to manage users.');
    }

    return this.userProxy.getUserByIdWithPermissionsAsync(userId);
    //_userPermissionsProxy.getAllUserPermissionsAsync();
  }

  updateUserPermissionsByUserIdAsync(userId, userPermissionsDto, issuer) {
    //if (issuer.role !== 'admin') {
    //	throw 'Not authorized to manage users.';
    //}
    return this.userProxy
      .getUserByIdWithPermissionsAsync(userId)
      .then(userPermissionsModel => {
        for (var key in userPermissionsDto) { // TODO Is there already some method to update instance model ?
          if (!userPermissionsDto.hasOwnProperty(key)) {
            continue;
          }
          userPermissionsModel.permissions[key] = userPermissionsDto[key];
        }
        return userPermissionsModel.permissions.save();
      });
  }

  updateFromUserDtoAsync(userId, userDto, issuer) {
    if (!issuer.permissions.isRoot && !issuer.permissions.isAdmin) {
      throw new Error('Not authorized to manage users.');
    }
    return this.updateUserPermissionsByUserIdAsync(userId, userDto.permissions, issuer)
      .then(() => {
        delete userDto.permissions;
        return this.userProxy.updateFromUserDtoAsync(userId, userDto, issuer);
      });
  }

  removeUserByIdAsync(userId, currentUser) {
    if (!currentUser.permissions.isRoot && !currentUser.permissions.isAdmin) {
      throw new Error('Not authorized to manage users.');
    }
    if (currentUser.id === userId) {
      throw new Error('Cannot remove yourself.');
    }

    return this.userProxy
      .getUserByIdWithPermissionsAsync(userId)
      .then(user => {
        if (!user) {
          return;
        }
        if (user.isRoot === true) {
          throw new Error('Root user cannot be removed.');
        }
        return this.userProxy.removeUserByIdAsync(user, currentUser);
      });
  }
}
