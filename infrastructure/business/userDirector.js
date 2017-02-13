'use strict';

var _userSaveService,
	_userPermissionsSaveService;
var Models = require('../models');

function UserDirector (userSaveService, userPermissionsSaveService) {
	_userSaveService = userSaveService;
	_userPermissionsSaveService = userPermissionsSaveService;
}
// TODO Check for rights before doing (directory should do not service layer)
UserDirector.prototype.getUsersAsync = function(owner) {
	if (owner.role !== 'admin') {
		throw 'Not authorized no manage users.';
	}
	return _userSaveService.getUsersAsync();
};

UserDirector.prototype.addUserAsync = function(user, owner) {
	if (owner.role !== 'admin') { // TODO Use role or isAdmin ? There is redundancy
		throw 'Not authorized no manage users.';
	}
	return _userSaveService.addUserAsync(user, owner);
};

UserDirector.prototype.addUserPermissionsAsync = function(userId, allowedPaths, owner) {
	if (owner.role !== 'admin') { // TODO Use role or isAdmin ? There is redundancy
		throw 'Not authorized no manage users.';
	}

	return _userPermissionsSaveService
		.addUserPermissionsAsync(userId, allowedPaths)
		.then(function(userPermissionsModel) {
			return _userSaveService.addUserPermissionsAsync(userId, userPermissionsModel, owner)
		});
};

UserDirector.prototype.updateFromUserDtoAsync = function(userId, userDto, owner) {
	if (owner.role !== 'admin') {
		throw 'Not authorized no manage users.';
	}
	return _userSaveService.updateFromUserDtoAsync(userId, userDto, owner);
};

UserDirector.prototype.removeUserByIdAsync = function(userId, currentUser) {
	//if (currentUser.role !== 'admin') {
	//	throw 'Not authorized no manage users.';
	//}
	//
	//return _userSaveService
	//	.getUserByIdWithPermissionsAsync(userId)
	//	.then(function(user) {
	//		if (user.isRoot === true) {
	//			throw 'Root user cannot be removed.';
	//		}
	//		return _userSaveService.removeUserByIdAsync(user, currentUser);
	//	});
};

module.exports = UserDirector;