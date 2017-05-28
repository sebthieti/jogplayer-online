import {autoinject, bindable} from 'aurelia-framework';
import UserViewModel from '../../view-models/user.viewModel';
import UserService from '../../services/user.service';

@autoinject
export class AddOrEditUserCustomElement {
  canShowIdentityTab = true;
  canShowHomePathTab = false;
  canShowDenyPathsTab = false;
  canShowAddUserPanel = false;
  canShowDenyPathsList = true;
  canShowDenyPathsExplorer = !this.canShowDenyPathsList;
  selectedDenyPath = '';
  isRootUser: boolean;
  newAllowedPath: string;
  @bindable userVm: UserViewModel;

  constructor(private userService: UserService) {
  }

  bind() {
    if (this.userVm.isExistingUser) {
      this.isRootUser = this.hasAdminPermissions;
    }
  }

  tabSelected(tabName: string) {
    switch (tabName) {
      case 'identity':
        this.canShowIdentityTab = true;
        this.canShowHomePathTab = false;
        this.canShowDenyPathsTab = false;
        break;
      case 'homePath':
        this.canShowIdentityTab = false;
        this.canShowHomePathTab = true;
        this.canShowDenyPathsTab = false;
        break;
      case 'denyPaths':
        this.canShowIdentityTab = false;
        this.canShowHomePathTab = false;
        this.canShowDenyPathsTab = true;
        break;
    }
  }

  get hasAdminPermissions(): boolean {
    return this.userVm.permissions &&
      (this.userVm.permissions.isRoot
      ||
      this.userVm.permissions.isAdmin);
  }

  addDenyPathToNewUser() {
    this.userVm.permissions.denyPaths.push(this.selectedDenyPath);
    this.canShowDenyPathsList = true;
    this.canShowDenyPathsExplorer = !this.canShowDenyPathsList;
  }

  showDenyPathExplorer() {
    this.canShowDenyPathsExplorer = true;
    this.canShowDenyPathsList = !this.canShowDenyPathsExplorer;
  }

  async endAddAllowedPathNewUser(userVm) {
    this.userVm.permissions.allowPaths.push(this.newAllowedPath);
    await this.userService.update(userVm);
    this.canShowAddUserPanel = false;
  }

  removeAllowPath(position: number) {
    this.userVm.permissions.allowPaths = this.userVm.permissions.allowPaths
      .filter((_, index) => index !== position);
  }

  removeDenyPath(position: number) {
    this.userVm.permissions.denyPaths = this.userVm.permissions.denyPaths
      .filter((_, index) => index !== position);
  }

  async submitUser() {
    if (this.userVm.isNewUser) {
      await this.userService.addUser(this.userVm, this.userVm.password);
      this.userVm.isEditing = false;
      this.canShowAddUserPanel = true;
    } else {
      await this.userService.updatePermissions(this.userVm.permissions);
      await this.userService.update(this.userVm);
      this.userVm.isEditing = false;
    }
  }

  cancelAddAllowedPath() {
    this.newAllowedPath = null;
  }

  cancelAddUser() {
    this.canShowAddUserPanel = false;
  }

  cancelEditUser(userVm) {
    userVm.isEditing = false;
  }
}
