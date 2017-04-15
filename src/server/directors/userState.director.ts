import {IUserStateModel} from '../models/userState.model';
import {UpdateUserStateRequest} from '../requests/updateUserState.request';
import {IUserModel} from '../models/user.model';

export interface IUserStateDirector {
  getAsync(issuer: IUserModel): IUserStateModel;
  updateAsync(
    userStateRequest: UpdateUserStateRequest,
    issuer: IUserModel
  ): Promise<IUserStateModel>;
}

export default class UserStateDirector implements IUserStateDirector {
  getAsync(issuer: IUserModel): IUserStateModel {
    return issuer.state;
  }

  async updateAsync(
    request: UpdateUserStateRequest,
    issuer: IUserModel
  ): Promise<IUserStateModel> {
    return issuer.state.setFromRequest(request).updateAsync();
  }
}
