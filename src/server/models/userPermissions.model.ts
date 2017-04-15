import {UserPermissions} from '../entities/userPermissions';
import {UpdatePermissionsRequest} from "../requests/updatePermissions.request";
import {IUserPermissionsRepository} from '../repositories/userPermissions.repository';
import {IUserModel} from './user.model';

export interface IUserPermissionsModel {
  canWrite: boolean;
  isAdmin: boolean;
  isRoot: boolean;
  allowPaths: string[];
  denyPaths: string[];
  homePath: string;
  setIsRoot(): IUserPermissionsModel;
  setIsAdmin(): IUserPermissionsModel;
  buildFromRequest(permissions: UpdatePermissionsRequest): IUserPermissionsModel;
  updateAsync(): Promise<IUserPermissionsModel>;
  updateWith(permissions: IUserPermissionsModel): IUserPermissionsModel;
  setFromRequest(request: UpdatePermissionsRequest): IUserPermissionsModel;
  toEntity(): UserPermissions;
}

export default class UserPermissionsModel implements IUserPermissionsModel {
  canWrite: boolean;
  isAdmin: boolean;
  isRoot: boolean;
  allowPaths: string[];
  denyPaths: string[];
  homePath: string;

  constructor(
    private user: IUserModel,
    private userPermissionsRepository: IUserPermissionsRepository,
    userPermissions: UserPermissions
  ) {
    Object.assign(
      this,
      userPermissions, {
        canWrite: null,
        isAdmin: null,
        isRoot: null,
        allowPaths: [],
        denyPaths: [],
        homePath: null
      } as UserPermissions
    );
  }

  setIsRoot(): IUserPermissionsModel {
    this.isRoot = true;
    return this;
  }

  setIsAdmin(): IUserPermissionsModel {
    this.isAdmin = true;
    return this;
  }

  updateWith(permissions: IUserPermissionsModel): IUserPermissionsModel {
    Object.assign(this, permissions);
    return this;
  }

  setFromRequest(request: UpdatePermissionsRequest): IUserPermissionsModel {
    Object.assign(this, request);
    return this;
  }

  buildFromRequest(permissions: UpdatePermissionsRequest): IUserPermissionsModel {
    Object.assign(this, permissions);
    return this;
  }

  async updateAsync(): Promise<IUserPermissionsModel> {
    await this.userPermissionsRepository.updateAsync(this.user._id, this.toEntity());
    return this;
  }

  toEntity(): UserPermissions {
    return {
      canWrite: this.canWrite,
      isAdmin: this.isAdmin,
      isRoot: this.isRoot,
      allowPaths: this.allowPaths,
      denyPaths: this.denyPaths,
      homePath: this.homePath
    }
  }
}
