import {UserPermissionsDto} from '../dto/userPermissions.dto';
import {IUserPermissionsModel} from '../models/userPermissions.model';

export default function toUserPermissionDto(userPermissions: IUserPermissionsModel): UserPermissionsDto {
  return {
    isAdmin: userPermissions.isAdmin,
    isRoot: userPermissions.isRoot,
    canWrite: userPermissions.canWrite,
    allowPaths: userPermissions.allowPaths,
    denyPaths: userPermissions.denyPaths,
    homePath: userPermissions.homePath
  } as UserPermissionsDto;
}
