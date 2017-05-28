import {NewUser, User} from '../entities/user';
import UserService from '../services/user.service';
import UserModel from '../models/user.model';
import UserPermissionsViewModel from './userPermissions.viewModel';

export default class UserViewModel extends UserModel {
  isEditing = false;
  permissions: UserPermissionsViewModel;
  password: string;

  constructor(service: UserService, user: User|NewUser) {
    super(service, user);
    // TODO For now
    // Object.assign(this, user);
    // this.permissions = new UserPermissionsViewModel(user.permissions);
  }
}
