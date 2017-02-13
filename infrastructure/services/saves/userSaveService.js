'use strict';

var Q = require('q'),
	_ = require('underscore');

var _saveService,
	User;

function UserSaveService(saveService, userModel) {
	_saveService = saveService;
	User = userModel;
}

UserSaveService.prototype.isRootUserSetAsync = function() {
	var defer = Q.defer();

	User.find({})
		.populate('permissions')
		.exec(function(err, users) {
			if (err) { defer.reject(err) }
			else {
				var isRootUserSet = _.any(users
					.map(function(user) {return user.permissions})
					.filter(function (permission) {
						return permission.isRoot === true;
					}));

				defer.resolve(isRootUserSet)
			}
		});

	return defer.promise;
};

UserSaveService.prototype.getUsersAsync = function() { // TODO getUsersWithPermissionsAsync
	var defer = Q.defer();

	User.find({})
		.populate('permissions')
		.exec(function(err, users) {
			if (err) { defer.reject(err) }
			else { defer.resolve(users) }
		});

	return defer.promise;
};

UserSaveService.prototype.getUserByIdWithPermissionsAsync = function(userId) {
	var defer = Q.defer();

	User.findOne({ _id: userId})
		.populate('permissions')
		.exec(function(err, user) {
			if (err) { defer.reject(err) }
			else { defer.resolve(user) }
		});

	return defer.promise;
};

UserSaveService.prototype.getUserByUsernameWithPermissionsAsync = function(username) {
	var defer = Q.defer();

	User.findOne({ username: username})
		.populate('permissions')
		.exec(function(err, user) {
			if (err) { defer.reject(err) }
			else { defer.resolve(user) }
		});

	return defer.promise;
};

UserSaveService.prototype.addRootUserAsync = function (userDto, userPermissionsModel) {
	if (!userDto) {
		throw new Error('SetupSaveService.addUserAsync: favorite must be set');
	}
	if (userDto._id) {
		throw new Error('SetupSaveService.addUserAsync: user.Id should not be set');
	}

	var defer = Q.defer();
	//delete userDto.permissions;
	userDto.permissions = null;
	//var userFields = userDto.getDefinedFields();

	User.create(
		userDto,
		function(err, newUser) {
			if (err) { defer.reject(err) }
			else {
				newUser.permissions = userPermissionsModel;
				newUser.save(function(writeError) {
					if (writeError) { defer.reject(writeError) }
					else { defer.resolve(newUser) }
				});
			}
		});

	return defer.promise;
};

UserSaveService.prototype.addUserAsync = function (userDto, userPermissionsModel, issuer) {
	if (!userDto) {
		throw new Error('SetupSaveService.addUserAsync: favorite must be set');
	}
	if (!issuer) {
		throw new Error('SetupSaveService.addUserAsync: issuer must be set');
	}
	if (userDto._id) {
		throw new Error('SetupSaveService.addUserAsync: user.Id should not be set');
	}

	var defer = Q.defer();
	//delete userDto.permissions;
	userDto.permissions = null;
	var userFields = userDto.getDefinedFields();

	User.create(
		userFields,
		function(err, newUser) {
			if (err) { defer.reject(err) }
			else {
				newUser.permissions = userPermissionsModel;
				newUser.save(function(writeError) {
					if (writeError) { defer.reject(writeError) }
					else { defer.resolve(newUser) }
				});
			}
		});

	return defer.promise;
};

UserSaveService.prototype.addUserPermissionsAsync = function (userId, permissionsArray, issuer) {
	var defer = Q.defer();

	User
		.findOne({ _id: userId }) // , ownerId: issuer.id
		.populate({ path: 'permissions', select: '_id' })
		.exec(function(readError, user) {
			if (readError) {
				defer.reject(readError);
			} else {
				user.permissions = user.permissions.concat(permissionsArray);
				user.save(function(writeError) {
					if (writeError) { defer.reject(writeError) }
					else { defer.resolve(permissionsArray) }
				});
			}
		});

	return defer.promise;
};

UserSaveService.prototype.updateFromUserDtoAsync = function (userId, userDto, issuer) {
	if (!userDto) {
		throw new Error('SetupSaveService.updateFromUserDtoAsync: user must be set');
	}
	if (!userId) {
		throw new Error('SetupSaveService.updateFromUserDtoAsync: user.Id should be set');
	}

	var defer = Q.defer();

	User.findOneAndUpdate(
		{ _id: userId }, // , ownerId: issuer.id
		userDto.getDefinedFields(),
		function(err, user) {
			if (err) { defer.reject(err) }
			else { defer.resolve(user) }
		}
	);

	return defer.promise;
};

UserSaveService.prototype.removeUserByIdAsync = function (userId, issuer) {
	if (!userId) {
		throw new Error('SetupSaveService.removeUserByIdAsync: userId must be set');
	}

	var defer = Q.defer();

	User.findOneAndRemove(
		{ _id: userId },
		function(err) {
			if (err) { defer.reject(err) }
			else { defer.resolve() }
		}
	);

	return defer.promise;
};

module.exports = UserSaveService;