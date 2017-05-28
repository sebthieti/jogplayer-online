import UserPermissionsModel from '../models/userPermissions.model';
import UserService from '../services/user.service';
import UserModel from '../models/user.model';
import {NewUserPermissions, UserPermissions} from '../entities/userPermissions';

export default class UserPermissionsViewModel extends UserPermissionsModel {
  isRoot: boolean;

  constructor(
    userService: UserService,
    userModel: UserModel,
    permissions: UserPermissions | NewUserPermissions
  ) {
    super(userService, userModel, permissions);
    Object.assign(this, permissions);
  }
}
