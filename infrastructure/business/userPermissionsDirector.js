'use strict';

var _userSaveService;
var Models = require('../models');

function UserPermissionsDirector (userSaveService) {
	_userSaveService = userSaveService;
}
// TODO Check for rights before doing (directory should do not service layer)
UserPermissionsDirector.prototype.getUserPermissions = function(userId, owner) {
	if (owner.role !== 'admin') {
		throw 'Not authorized no manage users.';
	}
	return _userSaveService.getUsersAsync();
};

UserPermissionsDirector.prototype.addUserPermissionsAsync = function(userId, allowedPaths, owner) {
	if (owner.role !== 'admin') { // TODO Use role or isAdmin ? There is redundancy
		throw 'Not authorized no manage users.';
	}
	var userPermissionsModel = new Models.UserPermissions({
		userId: userId,
		allowedPaths: allowedPaths
	});

	return utils.saveModelAsync(userPermissionsModel);//_userPermissionsSaveService.addUserAsync(user, owner);
};

UserPermissionsDirector.prototype.updateFromUserDtoAsync = function(userId, userDto, owner) {
	if (owner.role !== 'admin') {
		throw 'Not authorized no manage users.';
	}
	return _userSaveService.updateFromUserDtoAsync(userId, userDto, owner);
};

UserPermissionsDirector.prototype.removeUserByIdAsync = function(userId, currentUser) {
	if (currentUser.role !== 'admin') {
		throw 'Not authorized no manage users.';
	}

	return _userSaveService
		.getUserByIdWithPermissionsAsync(userId)
		.then(function(user) {
			if (user.isRoot === true) {
				throw 'Root user cannot be removed.';
			}
			return _userSaveService.removeUserByIdAsync(user, currentUser);
		});
};

module.exports = UserPermissionsDirector;