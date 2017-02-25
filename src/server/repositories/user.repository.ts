import * as _ from 'lodash';
import {IUserModel} from '../models/user.model';
import {IRepository} from './repository';

export interface IUserRepository {
  isRootUserSetAsync();
  getUsersAsync();
  getUserByIdWithPermissionsAsync(userId);
  getUserByUsernameWithPermissionsAsync(username);
  addRootUserAsync(userDto, userPermissionsModel);
  addUserAsync(userDto, userPermissionsModel, issuer);
  addUserPermissionsAsync (userId, permissionsArray, issuer);
  updateFromUserDtoAsync (userId, userDto, issuer);
  removeUserByIdAsync (userId, issuer);
}

export default class UserRepository implements IUserRepository {
  private User: IUserModel;

  constructor(private saveService: IRepository, userModel: IUserModel) {
    this.User = userModel;
  }

  isRootUserSetAsync() {
    return new Promise((resolve, reject) => {
      this.User.find({})
        .populate('permissions')
        .exec((err, users) => {
          if (err) {
            reject(err);
          } else {
            const isRootUserSet = _.some(users
              .map(user => user.permissions)
              .filter(permission => permission.isRoot === true)
            );

            resolve(isRootUserSet);
          }
        });
    });
  }

  getUsersAsync() { // TODO getUsersWithPermissionsAsync
    return new Promise((resolve, reject) => {
      this.User.find({})
        .populate('permissions')
        .exec((err, users) => {
          if (err) {
            reject(err);
          } else {
            resolve(users);
          }
        });
    });
  }

  getUserByIdWithPermissionsAsync(userId) {
    return new Promise((resolve, reject) => {
      this.User.findOne({ _id: userId})
        .populate('permissions')
        .exec((err, user) => {
          if (err) {
            reject(err);
          } else {
            resolve(user);
          }
        });
    });
  }

  getUserByUsernameWithPermissionsAsync(username) {
    return new Promise((resolve, reject) => {
      this.User.findOne({ username: username})
        .populate('permissions')
        .exec((err, user) => {
          if (err) {
            reject(err);
          } else {
            resolve(user);
          }
        });
    });
  }

  addRootUserAsync(userDto, userPermissionsModel) {
    return new Promise((resolve, reject) => {
      if (!userDto) {
        reject('SetupSaveService.addUserAsync: favorite must be set');
      }
      if (userDto._id) {
        reject('SetupSaveService.addUserAsync: user.Id should not be set');
      }

      // delete userDto.permissions;
      userDto.permissions = null;
      // var userFields = userDto.getDefinedFields();

      this.User.create(
        userDto,
        (err, newUser) => {
          if (err) {
            reject(err);
          } else {
            newUser.permissions = userPermissionsModel;
            newUser.save(writeError => {
              if (writeError) {
                reject(writeError);
              } else {
                resolve(newUser);
              }
            });
          }
        });
    });
  }

  addUserAsync(userDto, userPermissionsModel, issuer) {
    return new Promise((resolve, reject) => {
      if (!userDto) {
        reject('SetupSaveService.addUserAsync: favorite must be set');
      }
      if (!issuer) {
        reject('SetupSaveService.addUserAsync: issuer must be set');
      }
      if (userDto._id) {
        reject('SetupSaveService.addUserAsync: user.Id should not be set');
      }

      //delete userDto.permissions;
      userDto.permissions = null;
      const userFields = userDto.getDefinedFields();

      this.User.create(
        userFields,
        (err, newUser) => {
          if (err) {
            reject(err);
          } else {
            newUser.permissions = userPermissionsModel;
            newUser.save(writeError => {
              if (writeError) {
                reject(writeError);
              } else {
                resolve(newUser);
              }
            });
          }
        });
    });
  }

  addUserPermissionsAsync (userId, permissionsArray, issuer) {
    return new Promise((resolve, reject) => {
      this.User
        .findOne({ _id: userId }) // , ownerId: issuer.id
        .populate({ path: 'permissions', select: '_id' })
        .exec((readError, user) => {
          if (readError) {
            reject(readError);
          } else {
            user.permissions = user.permissions.concat(permissionsArray);
            user.save(writeError => {
              if (writeError) {
                reject(writeError);
              } else {
                resolve(permissionsArray);
              }
            });
          }
        });
    });
  }

  updateFromUserDtoAsync (userId, userDto, issuer) {
    return new Promise((resolve, reject) => {
      if (!userDto) {
        reject('SetupSaveService.updateFromUserDtoAsync: user must be set');
      }
      if (!userId) {
        reject('SetupSaveService.updateFromUserDtoAsync: user.Id should be set');
      }

      this.User.findOneAndUpdate(
        { _id: userId }, // , ownerId: issuer.id
        userDto.getDefinedFields(),
        { 'new': true }, // Return modified doc.
        (err, user) => {
          if (err) {
            reject(err);
          } else {
            resolve(user);
          }
        }
      );
    });
  }

  removeUserByIdAsync (userId, issuer) {
    return new Promise((resolve, reject) => {
      if (!userId) {
        reject('SetupSaveService.removeUserByIdAsync: userId must be set');
      }

      this.User.findOneAndRemove(
        { _id: userId },
        err => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        }
      );
    });
  }
}
