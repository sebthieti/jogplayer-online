import {autoinject} from 'aurelia-framework';
import UserService from '../../../services/user.service';
import UserViewModel from '../../../view-models/user.viewModel';
import {NewUser} from '../../../entities/user';
import AuthenticationService from '../../../services/authentication.service';
import {NewUserPermissions} from '../../../entities/userPermissions';

@autoinject
export class ManageUsers {
  usersVm: UserViewModel[];
  canShowAddUserArea = false;
  canShowAddUserPanel = false;
  canShowAddAllowedPathArea = true;
  private addingAtPosition: number;

  constructor(
    private userService: UserService,
    private authenticationService: AuthenticationService
  ) {}

  async bind() {
    const user = this.authenticationService.getActiveUser();
    if (!user.permissions.isRoot && !user.permissions.isAdmin) {
      return;
    }

    const users = await this.userService.getUsers();
    if (users == null) {
      this.usersVm = null;
      return;
    }

    this.usersVm = users.map(x => new UserViewModel(this.userService, x));
  }

  beginAddUser() {
    // Toggle all editing users
    this.usersVm.forEach(vm => vm.isEditing = false);

    const newUser = new UserViewModel(this.userService, {
      isActive: true,
      fullName: '',
      username: '',
      email: '',
      permissions: {
        isAdmin: false,
        canWrite: false,
        allowPaths: [],
        denyPaths: [],
        homePath: ''
      } as NewUserPermissions
    } as NewUser);
    newUser.isEditing = true;
    this.addingAtPosition = this.usersVm.push(newUser);
    this.canShowAddUserArea = true;
    this.canShowAddUserPanel = true;
  }

  beginEditUser(userVm) {
    this.usersVm.forEach(vm => vm.isEditing = false);
    userVm.isEditing = true;
  }

  cancelAddUser() {
    this.usersVm.splice(this.addingAtPosition - 1, 1);
    this.addingAtPosition = -1;
    this.canShowAddUserArea = false;
    this.canShowAddUserPanel = false;
  }

  cancelEditUser(userVm) {
    userVm.isEditing = false;
  }

  async removeUser(position: number, userVm: UserViewModel) {
    await this.userService.removeUser(userVm);
    this.usersVm.splice(position, 1);
  }
}
