'use strict';

var Models = require('../models'),
	utils = require('../utils'),
	hasher = require('../utils/hasher');

var _userProxy,
	_userPermissionsDirector/*,
	_userPermissionsProxy*/;

function UserDirector (userPermissionsDirector, userSaveProxy/*, userPermissionsProxy*/) {
	_userPermissionsDirector = userPermissionsDirector;
	_userProxy = userSaveProxy;
	//_userPermissionsProxy = userPermissionsProxy;
}

UserDirector.prototype.isRootUserSetAsync = function() {
	return _userProxy.isRootUserSetAsync();
};

// TODO Check for rights before doing (directory should do not service layer)
UserDirector.prototype.getUsersAsync = function(issuer) {
	if (!issuer.permissions.isRoot && !issuer.permissions.isAdmin) {
		throw new Error('Not authorized to manage users.');
	}
	return _userProxy.getUsersAsync();
};

// TODO Refactor needed (use code from addUserAsync)
UserDirector.prototype.addRootUserAsync = function(rootUserDto) {
	// Generate password salt
	var passwordSalt = hasher.createSalt();
	var hashedPassword = hasher.computeHash(rootUserDto.password, passwordSalt);

	// TODO userDto s/not be altered
	rootUserDto.passwordSalt = passwordSalt;
	rootUserDto.password = hashedPassword; // TODO Rename in model to hashedPassword

	return _userPermissionsDirector //_userPermissionsProxy
		.addRootUserPermissionsAsync()
		.then(function(userPermissionsModel) {
			return _userProxy.addRootUserAsync(rootUserDto, userPermissionsModel);
		});
};

UserDirector.prototype.addUserAsync = function(userDto, issuer) {
	if (!issuer.permissions.isRoot && !issuer.permissions.isAdmin) { // TODO Use role or isAdmin ? There is redundancy
		throw new Error('Not authorized to manage users.');
	}
	// Generate password salt
	var passwordSalt = hasher.createSalt();
	var hashedPassword = hasher.computeHash(userDto.password, passwordSalt);

	// TODO userDto s/not be altered
	userDto.passwordSalt = passwordSalt;
	userDto.password = hashedPassword; // TODO Rename in model to hashedPassword

	return _userPermissionsDirector //_userPermissionsProxy
		.addUserPermissionsAsync(userDto.permissions, issuer)
		.then(function(userPermissionsModel) {
			return _userProxy.addUserAsync(userDto, userPermissionsModel, issuer);
		});
};

UserDirector.prototype.addUserPermissionsAsync = function(userId, allowedPaths, issuer) {
	if (!issuer.permissions.isRoot && !issuer.permissions.isAdmin) { // TODO Use role or isAdmin ? There is redundancy
		throw new Error('Not authorized to manage users.');
	}

	return _userProxy //_userPermissionsProxy
		.addUserPermissionsAsync(userId, allowedPaths)
		.then(function(userPermissionsModel) {
			return _userProxy.addUserPermissionsAsync(userId, userPermissionsModel, issuer)
		});
};

UserDirector.prototype.getUserPermissionsByUserId = function(userId, issuer) {
	if (!issuer.permissions.isRoot && !issuer.permissions.isAdmin) { // TODO Use role or isAdmin ? There is redundancy
		throw new Error('Not authorized to manage users.');
	}

	return _userProxy
		.getUserByIdWithPermissionsAsync(userId)
		.then(function(userPermissionsModel) {
			return userPermissionsModel.permissions;
		});
};

UserDirector.prototype.getAllUserPermissionsAsync = function(userId, allowedPaths, issuer) {
	if (!issuer.permissions.isRoot && !issuer.permissions.isAdmin) { // TODO Use role or isAdmin ? There is redundancy
		throw new Error('Not authorized to manage users.');
	}

	return _userProxy.getUserByIdWithPermissionsAsync(userId);
	//_userPermissionsProxy
		//.getAllUserPermissionsAsync();
};

UserDirector.prototype.updateUserPermissionsByUserIdAsync = function(userId, userPermissionsDto, issuer) {
	//if (issuer.role !== 'admin') {
	//	throw 'Not authorized to manage users.';
	//}
	return _userProxy
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
		throw new Error('Not authorized to manage users.');
	}
	return this.updateUserPermissionsByUserIdAsync(userId, userDto.permissions, issuer)
		.then(function() {
			delete userDto.permissions;
			return _userProxy.updateFromUserDtoAsync(userId, userDto, issuer);
		});
};

UserDirector.prototype.removeUserByIdAsync = function(userId, currentUser) {
	if (!currentUser.permissions.isRoot && !currentUser.permissions.isAdmin) {
		throw new Error('Not authorized to manage users.');
	}
	if (currentUser.id === userId) {
		throw new Error("Cannot remove yourself.");
	}

	return _userProxy
		.getUserByIdWithPermissionsAsync(userId)
		.then(function(user) {
			if (!user) {
				return;
			}
			if (user.isRoot === true) {
				throw new Error('Root user cannot be removed.');
			}
			return _userProxy.removeUserByIdAsync(user, currentUser);
		});
};

module.exports = UserDirector;
