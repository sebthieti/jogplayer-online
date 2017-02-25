import {IUserModel} from '../models/user.model';

export interface IConfigRepository {
  addRootUserAsync(user);
}

export default class ConfigRepository implements IConfigRepository {
  private User: IUserModel;

  constructor(userModel: IUserModel) {
    this.User = userModel;
  }

  addRootUserAsync(user) {
    return new Promise((resolve, reject) => {
      this.User.create({
        isActive: true,
        username: '',
        password: '',
        passwordSalt: '',
        fullName: '',
        email: ''
      }, (err, newUser) => {
        if (err) {
          reject(err);
        } else {
          // newUser.permissions = userPermissionsModel;
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
}
