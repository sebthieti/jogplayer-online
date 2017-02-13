'use strict';

var Models = require('../models'),
	utils = require('../utils');

var _userSaveService,
	UserPermissionsModel;

function UserPermissionsDirector (userSaveService, userPermissionsModel) { // TODO S/b moved
	_userSaveService = userSaveService;
	UserPermissionsModel = userPermissionsModel;
}
// TODO Check for rights before doing (directory should do not service layer)
UserPermissionsDirector.prototype.getUserPermissions = function(userId, owner) {
	if (owner.role !== 'admin') {
		throw 'Not authorized no manage users.';
	}
	return _userSaveService.getUsersAsync();
};

UserPermissionsDirector.prototype.addUserPermissionsAsync = function(permissionsDto, owner) {//userId, allowedPaths
	if (!owner.permissions.isRoot && !owner.permissions.isAdmin) { // TODO Use role or isAdmin ? There is redundancy
		throw 'Not authorized no manage users.';
	}
	var userPermissionsModel = new UserPermissionsModel(permissionsDto);

	return utils.saveModelAsync(userPermissionsModel);//_userPermissionsSaveService.addUserAsync(user, owner);
};

UserPermissionsDirector.prototype.updateFromUserDtoAsync = function(userId, userDto, owner) {
	if (!owner.permissions.isRoot && !owner.permissions.isAdmin) {
		throw 'Not authorized no manage users.';
	}
	return _userSaveService.updateFromUserDtoAsync(userId, userDto, owner);
};

UserPermissionsDirector.prototype.removeUserByIdAsync = function(userId, owner) {
	if (!owner.permissions.isRoot && !owner.permissions.isAdmin) {
		throw 'Not authorized no manage users.';
	}

	return _userSaveService
		.getUserByIdWithPermissionsAsync(userId)
		.then(function(user) {
			if (user.isRoot === true) {
				throw 'Root user cannot be removed.';
			}
			return _userSaveService.removeUserByIdAsync(user, owner);
		});
};

module.exports = UserPermissionsDirector;