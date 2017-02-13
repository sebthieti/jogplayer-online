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
UserPermissionsDirector.prototype.getUserPermissions = function(userId, issuer) {
	if (issuer.role !== 'admin') {
		throw new Error('Not authorized no manage users.');
	}
	return _userSaveService.getUsersAsync();
};

UserPermissionsDirector.prototype.addRootUserPermissionsAsync = function() {//userId, allowedPaths
	var userPermissionsModel = new UserPermissionsModel({ isRoot: true });

	return utils.saveModelAsync(userPermissionsModel);//_userPermissionsProxy.addUserAsync(user, issuer);
};

UserPermissionsDirector.prototype.addUserPermissionsAsync = function(permissionsDto, issuer) {//userId, allowedPaths
	if (!issuer.permissions.isRoot && !issuer.permissions.isAdmin) { // TODO Use role or isAdmin ? There is redundancy
		throw new Error('Not authorized no manage users.');
	}
	var userPermissionsModel = new UserPermissionsModel(permissionsDto);

	return utils.saveModelAsync(userPermissionsModel);//_userPermissionsProxy.addUserAsync(user, issuer);
};

UserPermissionsDirector.prototype.updateFromUserDtoAsync = function(userId, userDto, issuer) {
	if (!issuer.permissions.isRoot && !issuer.permissions.isAdmin) {
		throw new Error('Not authorized no manage users.');
	}
	return _userSaveService.updateFromUserDtoAsync(userId, userDto, issuer);
};

UserPermissionsDirector.prototype.removeUserByIdAsync = function(userId, issuer) {
	if (!issuer.permissions.isRoot && !issuer.permissions.isAdmin) {
		throw new Error('Not authorized no manage users.');
	}

	return _userSaveService
		.getUserByIdWithPermissionsAsync(userId)
		.then(function(user) {
			if (user.isRoot === true) {
				throw new Error('Root user cannot be removed.');
			}
			return _userSaveService.removeUserByIdAsync(user, issuer);
		});
};

module.exports = UserPermissionsDirector;