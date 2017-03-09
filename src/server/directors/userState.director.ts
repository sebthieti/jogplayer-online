import {IUserStateProxy} from '../proxies/userState.proxy';
import {User} from '../models/user.model';
import {IUserStateDto} from '../dto/userState.dto';
import {UserState} from '../models/userState.model';

export interface IUserStateDirector {
  getUserStateAsync(issuer: User): Promise<UserState>;
  addUserStateAsync(userStateDto: IUserStateDto, issuer: User): Promise<UserState>;
  updateFromUserStateDtoAsync(userStateId: string, userStateDto, issuer: User): Promise<UserState>;
  removeUserStateByIdAsync(userId: string, currentUser: User);
}

export default class UserStateDirector implements IUserStateDirector {
  constructor(private userStateProxy: IUserStateProxy) {
  }

  getUserStateAsync(issuer: User): Promise<UserState> {
    return this.userStateProxy.getUserStateAsync(issuer._id);
  }

  addUserStateAsync(userStateDto: IUserStateDto, issuer: User): Promise<UserState> {
    return this.userStateProxy.addUserStateAsync(issuer._id, userStateDto);
  }

  updateFromUserStateDtoAsync(userStateId: string, userStateDto, issuer: User): Promise<UserState> {
    return this.userStateProxy.updateFromUserStateDtoAsync(userStateId, issuer._id, userStateDto);
  }

  removeUserStateByIdAsync(userId: string, currentUser: User) {
    //if (currentUser.role !== 'admin') {
    //	throw 'Not authorized no manage users.';
    //}
    //
    //return _userStateSaveService
    //	.getUserStateAsync(userId)
    //	.then(function(user) {
    //		if (user.isRoot === true) {
    //			throw 'Root user cannot be removed.';
    //		}
    //		return _userStateSaveService.removeUserByIdAsync(user, currentUser);
    //	});
  }
}
