'use strict';

var _userStateSaveService;

function UserStateDirector (userStateSaveService) {
	_userStateSaveService = userStateSaveService;
}

UserStateDirector.prototype.getUserStateAsync = function(owner) {
	return _userStateSaveService.getUserStateAsync(owner._id);
};

UserStateDirector.prototype.addUserStateAsync = function(userStateDto, owner) {
	return _userStateSaveService.addUserStateAsync(owner._id, userStateDto);
};

UserStateDirector.prototype.updateFromUserStateDtoAsync = function(userStateId, userStateDto, owner) {
	return _userStateSaveService.updateFromUserStateDtoAsync(userStateId, owner._id, userStateDto);
};

UserStateDirector.prototype.removeUserStateByIdAsync = function(userId, currentUser) {
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
};

module.exports = UserStateDirector;