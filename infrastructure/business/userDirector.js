'use strict';

var Models = require('../models'),
	utils = require('../utils');

var _userSaveService,
	_userPermissionsSaveService;

function UserDirector (userSaveService, userPermissionsSaveService) {
	_userSaveService = userSaveService;
	_userPermissionsSaveService = userPermissionsSaveService;
}
// TODO Check for rights before doing (directory should do not service layer)
UserDirector.prototype.getUsersAsync = function(owner) {
	if (!owner.permissions.isRoot || !owner.permissions.isAdmin) {
		throw 'Not authorized no manage users.';
	}
	return _userSaveService.getUsersAsync();
};

UserDirector.prototype.addUserAsync = function(user, owner) {
	if (!owner.permissions.isRoot || !owner.permissions.isAdmin) { // TODO Use role or isAdmin ? There is redundancy
		throw 'Not authorized no manage users.';
	}
	return _userSaveService.addUserAsync(user, owner);
};

UserDirector.prototype.addUserPermissionsAsync = function(userId, allowedPaths, owner) {
	if (!owner.permissions.isRoot || !owner.permissions.isAdmin) { // TODO Use role or isAdmin ? There is redundancy
		throw 'Not authorized no manage users.';
	}

	return _userPermissionsSaveService
		.addUserPermissionsAsync(userId, allowedPaths)
		.then(function(userPermissionsModel) {
			return _userSaveService.addUserPermissionsAsync(userId, userPermissionsModel, owner)
		});
};

UserDirector.prototype.getUserPermissionsByUserId = function(userId, owner) {
	return _userSaveService
		.getUserByIdWithPermissionsAsync(userId)
		.then(function(userPermissionsModel) {
			return userPermissionsModel.permissions;
		});
};

UserDirector.prototype.getAllUserPermissionsAsync = function(userId, allowedPaths, owner) {
	//if (owner.role !== 'admin') { // TODO Use role or isAdmin ? There is redundancy
	//	throw 'Not authorized no manage users.';
	//}

	return _userPermissionsSaveService
		.getAllUserPermissionsAsync();
};

UserDirector.prototype.updateUserPermissionsByUserIdAsync = function(userId, userDto, owner) {
	//if (owner.role !== 'admin') {
	//	throw 'Not authorized no manage users.';
	//}
	return _userSaveService
		.getUserByIdWithPermissionsAsync(userId)
		.then(function(userPermissionsModel) {
			for (var key in userDto) { // TODO Is there already some method to update instance model ?
				if (!userDto.hasOwnProperty(key)) {
					continue;
				}
				userPermissionsModel.permissions[key] = userDto[key];
			}
			return utils.saveModelAsync(userPermissionsModel.permissions);
		});
};



UserDirector.prototype.updateFromUserDtoAsync = function(userId, userDto, owner) {
	if (!owner.permissions.isRoot || !owner.permissions.isAdmin) {
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