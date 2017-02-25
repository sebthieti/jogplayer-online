import {IUserPermissionsModel} from '../models/userPermissions.model';

export interface IUserPermissionsRepository {
  getAllUserPermissionsAsync();
  getUserPermissionsAsync(userId);
  addUserPermissionsAsync(userPermissions);
  updateFromUserDtoAsync(userId, userDto, issuer);
  removeUserByIdAsync(userId, issuer);
}

export default class UserPermissionsRepository implements IUserPermissionsRepository {
  private UserPermissions: IUserPermissionsModel;

  constructor(userPermissionsModel: IUserPermissionsModel) {
    this.UserPermissions = userPermissionsModel;
  }

  getAllUserPermissionsAsync() {
    return new Promise((resolve, reject) => {
      this.UserPermissions
        .find({})
        .exec((err, userPermissions) => {
          if (err) {
            reject(err);
          } else {
            resolve(userPermissions);
          }
        });
    });
  }

  getUserPermissionsAsync(userId) { // TODO getUsersWithPermissionsAsync
    return new Promise((resolve, reject) => {
      this.UserPermissions
        .find({ userId: userId })
        .exec((err, userPermissions) => {
          if (err) {
            reject(err);
          } else {
            resolve(userPermissions);
          }
        });
    });
  }

  addUserPermissionsAsync(userPermissions) {
    return new Promise((resolve, reject) => {
      if (!userPermissions) {
        reject('UserPermissionsSaveService.addUserPermissionsAsync: userPermissions must be set');
      }

      const userPermissionsFields = userPermissions.getDefinedFields();

      this.UserPermissions.create(
        userPermissionsFields,
        (err, newUserPermissions) => {
          if (err) {
            reject(err);
          } else {
            resolve(newUserPermissions);
          }
        });
    });
  }

  updateFromUserDtoAsync(userId, userDto, issuer) {
    return new Promise((resolve, reject) => {
      if (!userDto) {
        reject('SetupSaveService.updateFromUserDtoAsync: user must be set');
      }
      if (!userId) {
        reject('SetupSaveService.updateFromUserDtoAsync: user.Id should be set');
      }

      this.UserPermissions.findOneAndUpdate(
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
  };

  removeUserByIdAsync(userId, issuer) {
    return new Promise((resolve, reject) => {
      if (!userId) {
        reject('SetupSaveService.removeUserByIdAsync: userId must be set');
      }

      this.UserPermissions.findOneAndRemove(
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
