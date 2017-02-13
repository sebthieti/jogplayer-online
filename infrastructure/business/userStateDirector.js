'use strict';

var _userStateSaveService;

function UserStateDirector (userStateSaveService) {
	_userStateSaveService = userStateSaveService;
}

UserStateDirector.prototype.getUserStateAsync = function(issuer) {
	return _userStateSaveService.getUserStateAsync(issuer._id);
};

UserStateDirector.prototype.addUserStateAsync = function(userStateDto, issuer) {
	return _userStateSaveService.addUserStateAsync(issuer._id, userStateDto);
};

UserStateDirector.prototype.updateFromUserStateDtoAsync = function(userStateId, userStateDto, issuer) {
	return _userStateSaveService.updateFromUserStateDtoAsync(userStateId, issuer._id, userStateDto);
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