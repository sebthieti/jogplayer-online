import {UpdatePermissionsRequest} from '../requests/updatePermissions.request';
import {IUserModel} from '../models/user.model';
import {IUserPermissionsModel} from '../models/userPermissions.model';

export interface IUserPermissionsDirector {
  updateAsync(
    userId: string,
    permissionsRequest: UpdatePermissionsRequest,
    issuer: IUserModel
  ): Promise<IUserPermissionsModel>;
}

export default class UserPermissionsDirector implements IUserPermissionsDirector {
  updateAsync(
    userId: string,
    request: UpdatePermissionsRequest,
    issuer: IUserModel
  ): Promise<IUserPermissionsModel> {
    if (issuer.role !== 'admin') {
      throw 'Not authorized to manage users.';
    }

    return issuer.permissions.setFromRequest(request).updateAsync();
  }
}
