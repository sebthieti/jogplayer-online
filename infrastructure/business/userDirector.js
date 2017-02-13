'use strict';

var Models = require('../models'),
	utils = require('../utils'),
	hasher = require('../utils/hasher');

var _userSaveService,
	_userPermissionsDirector,
	_userPermissionsSaveService;

function UserDirector (userPermissionsDirector, userSaveService, userPermissionsSaveService) {
	_userPermissionsDirector = userPermissionsDirector;
	_userSaveService = userSaveService;
	_userPermissionsSaveService = userPermissionsSaveService;
}

UserDirector.prototype.isRootUserSetAsync = function() {
	return _userSaveService.isRootUserSetAsync();
};

// TODO Check for rights before doing (directory should do not service layer)
UserDirector.prototype.getUsersAsync = function(issuer) {
	if (!issuer.permissions.isRoot && !issuer.permissions.isAdmin) {
		throw 'Not authorized no manage users.';
	}
	return _userSaveService.getUsersAsync();
};

// TODO Refactor needed (use code from addUserAsync)
UserDirector.prototype.addRootUserAsync = function(rootUserDto) {
	// Generate password salt
	var passwordSalt = hasher.createSalt();
	var hashedPassword = hasher.computeHash(rootUserDto.password, passwordSalt);

	// TODO userDto s/not be altered
	rootUserDto.passwordSalt = passwordSalt;
	rootUserDto.password = hashedPassword; // TODO Rename in model to hashedPassword

	return _userPermissionsDirector //_userPermissionsSaveService
		.addRootUserPermissionsAsync()
		.then(function(userPermissionsModel) {
			return _userSaveService.addRootUserAsync(rootUserDto, userPermissionsModel);
		});
};

UserDirector.prototype.addUserAsync = function(userDto, issuer) {
	if (!issuer.permissions.isRoot && !issuer.permissions.isAdmin) { // TODO Use role or isAdmin ? There is redundancy
		throw 'Not authorized no manage users.';
	}
	// Generate password salt
	var passwordSalt = hasher.createSalt();
	var hashedPassword = hasher.computeHash(userDto.password, passwordSalt);

	// TODO userDto s/not be altered
	userDto.passwordSalt = passwordSalt;
	userDto.password = hashedPassword; // TODO Rename in model to hashedPassword

	return _userPermissionsDirector //_userPermissionsSaveService
		.addUserPermissionsAsync(userDto.permissions, issuer)
		.then(function(userPermissionsModel) {
			return _userSaveService.addUserAsync(userDto, userPermissionsModel, issuer);
		});
};

UserDirector.prototype.addUserPermissionsAsync = function(userId, allowedPaths, issuer) {
	if (!issuer.permissions.isRoot && !issuer.permissions.isAdmin) { // TODO Use role or isAdmin ? There is redundancy
		throw 'Not authorized no manage users.';
	}

	return _userPermissionsSaveService
		.addUserPermissionsAsync(userId, allowedPaths)
		.then(function(userPermissionsModel) {
			return _userSaveService.addUserPermissionsAsync(userId, userPermissionsModel, issuer)
		});
};

UserDirector.prototype.getUserPermissionsByUserId = function(userId, issuer) {
	return _userSaveService
		.getUserByIdWithPermissionsAsync(userId)
		.then(function(userPermissionsModel) {
			return userPermissionsModel.permissions;
		});
};

UserDirector.prototype.getAllUserPermissionsAsync = function(userId, allowedPaths, issuer) {
	//if (issuer.role !== 'admin') { // TODO Use role or isAdmin ? There is redundancy
	//	throw 'Not authorized no manage users.';
	//}

	return _userPermissionsSaveService
		.getAllUserPermissionsAsync();
};

UserDirector.prototype.updateUserPermissionsByUserIdAsync = function(userId, userPermissionsDto, issuer) {
	//if (issuer.role !== 'admin') {
	//	throw 'Not authorized no manage users.';
	//}
	return _userSaveService
		.getUserByIdWithPermissionsAsync(userId)
		.then(function(userPermissionsModel) {
			for (var key in userPermissionsDto) { // TODO Is there already some method to update instance model ?
				if (!userPermissionsDto.hasOwnProperty(key)) {
					continue;
				}
				userPermissionsModel.permissions[key] = userPermissionsDto[key];
			}
			return utils.saveModelAsync(userPermissionsModel.permissions);
		});
};



UserDirector.prototype.updateFromUserDtoAsync = function(userId, userDto, issuer) {
	if (!issuer.permissions.isRoot && !issuer.permissions.isAdmin) {
		throw 'Not authorized no manage users.';
	}
	return this.updateUserPermissionsByUserIdAsync(userId, userDto.permissions, issuer)
		.then(function() {
			delete userDto.permissions;
			return _userSaveService.updateFromUserDtoAsync(userId, userDto, issuer);
		});
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