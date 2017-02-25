import {IUserStateProxy} from '../proxies/userState.proxy';

export interface IUserStateDirector {
  getUserStateAsync(issuer);
  addUserStateAsync(userStateDto, issuer);
  updateFromUserStateDtoAsync(userStateId, userStateDto, issuer);
  removeUserStateByIdAsync(userId, currentUser);
}

export default class UserStateDirector implements IUserStateDirector {
  constructor(private userStateProxy: IUserStateProxy) {
  }

  getUserStateAsync(issuer) {
    return this.userStateProxy.getUserStateAsync(issuer._id);
  }

  addUserStateAsync(userStateDto, issuer) {
    return this.userStateProxy.addUserStateAsync(issuer._id, userStateDto);
  }

  updateFromUserStateDtoAsync(userStateId, userStateDto, issuer) {
    return this.userStateProxy.updateFromUserStateDtoAsync(userStateId, issuer._id, userStateDto);
  }

  removeUserStateByIdAsync(userId, currentUser) {
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
