import {UserPermissions} from '../entities/userPermissions';
import {UserRepository} from '../repositories/user.repository';
import UserModel from './user.model';
import {UpdatePermissions} from '../entities/user';

interface UserPermissionsModelSnapshot {
  isAdmin: boolean;
  canWrite: boolean;
  allowPaths: string[];
  denyPaths: string[];
  homePath: string;
}

export default class UserPermissionsModel {
  isAdmin: boolean;
  isRoot: boolean;
  canWrite: boolean;
  allowPaths: string[];
  denyPaths: string[];
  homePath: string;

  private previousSnapshot: UserPermissionsModelSnapshot;

  constructor(
    private userRepository: UserRepository,
    private user: UserModel,
    permissions?: UserPermissions
  ) {
    this.setFromEntity(permissions);
  }

  setFromEntity(permissions: UserPermissions): UserPermissionsModel {
    Object.assign(this, permissions);
    this.takeSnapshot();
    return this;
  }

  async update(): Promise<UserPermissionsModel> {
    const updatedPermissions = await this.userRepository.updateUserPermissions(
      this.user.id,
      this.toUpdateRequest()
    );
    this.setFromEntity(updatedPermissions);

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
