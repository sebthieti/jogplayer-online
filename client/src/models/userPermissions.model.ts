import {NewUserPermissions, UserPermissions} from '../entities/userPermissions';
import UserModel from './user.model';
import {UpdatePermissions} from '../entities/user';
import UserService from '../services/user.service';

interface UserPermissionsModelSnapshot {
  isAdmin: boolean;
  canWrite: boolean;
  allowPaths: string[];
  denyPaths: string[];
  homePath: string;
}

export default class UserPermissionsModel {
  isRoot: boolean;
  isAdmin: boolean;
  canWrite: boolean;
  allowPaths: string[];
  denyPaths: string[];
  homePath: string;

  private previousSnapshot: UserPermissionsModelSnapshot;

  constructor(
    private userService: UserService,
    public user: UserModel,
    permissions?: UserPermissions | NewUserPermissions
  ) {
    this.setFromEntity(permissions);
  }

  setFromEntity(permissions: UserPermissions | NewUserPermissions): UserPermissionsModel {
    Object.assign(this, permissions);
    this.takeSnapshot();
    return this;
  }

  private takeSnapshot(): void {
    this.previousSnapshot = {
      isAdmin: this.isAdmin,
      canWrite: this.canWrite,
      allowPaths: this.allowPaths,
      denyPaths: this.denyPaths,
      homePath: this.homePath
    };
  }

  toUpdateRequest(): UpdatePermissions {
    let update = {} as UpdatePermissions;

    if (!this.previousSnapshot || this.isAdmin !== this.previousSnapshot.isAdmin) {
      update.isAdmin = this.isAdmin;
    } if (!this.previousSnapshot || this.canWrite !== this.previousSnapshot.canWrite) {
      update.canWrite = this.canWrite;
    } if (!this.previousSnapshot || this.allowPaths !== this.previousSnapshot.allowPaths) {
      update.allowPaths = this.allowPaths;
    } if (!this.previousSnapshot || this.denyPaths !== this.previousSnapshot.denyPaths) {
      update.denyPaths = this.denyPaths;
    } if (!this.previousSnapshot || this.homePath !== this.previousSnapshot.homePath) {
      update.homePath = this.homePath;
    }

    return update;
  }
}
