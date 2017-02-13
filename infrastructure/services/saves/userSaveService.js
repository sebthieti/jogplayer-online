'use strict';

var Q = require('q');

var _saveService,
	User;

function UserSaveService(saveService, userModel) {
	_saveService = saveService;
	User = userModel;
}

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
		.populate({
			path: 'permissions',
			select: '_id'
		})
		.exec(function(err, user) {
			if (err) { defer.reject(err) }
			else { defer.resolve(user) }
		});

	return defer.promise;
};

UserSaveService.prototype.getUserByUsernameAsync = function(username) {
	var defer = Q.defer();

	User.findOne({ username: username})
		.populate('permissions')
		.exec(function(err, user) {
			if (err) { defer.reject(err) }
			else { defer.resolve(user) }
		});

	return defer.promise;
};

UserSaveService.prototype.addUserAsync = function (user, owner) {
	if (!user) {
		throw "UserStateSaveService.addUserAsync: favorite must be set";
	}
	if (!owner) {
		throw "UserStateSaveService.addUserAsync: owner must be set";
	}
	if (user._id) {
		throw "UserStateSaveService.addUserAsync: user.Id should not be set";
	}

	var defer = Q.defer();

	var userFields = user.getDefinedFields();

	User.create(
		userFields,
		function(err, newUser) {
			if (err) { defer.reject(err) }
			else { defer.resolve(newUser) }
		});

	return defer.promise;
};

UserSaveService.prototype.addUserPermissionsAsync = function (userId, permissionsArray, owner) {
	var defer = Q.defer();

	User
		.findOne({ _id: userId }) // , ownerId: owner.id
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

UserSaveService.prototype.updateFromUserDtoAsync = function (userId, userDto, owner) {
	if (!userDto) {
		throw "UserStateSaveService.updateFromUserDtoAsync: user must be set";
	}
	if (!userId) {
		throw "UserStateSaveService.updateFromUserDtoAsync: user.Id should be set";
	}

	var defer = Q.defer();

	User.findOneAndUpdate(
		{ _id: userId }, // , ownerId: owner.id
		userDto.getDefinedFields(),
		function(err, user) {
			if (err) { defer.reject(err) }
			else { defer.resolve(user) }
		}
	);

	return defer.promise;
};

UserSaveService.prototype.removeUserByIdAsync = function (userId, owner) {
	if (!userId) {
		throw "UserStateSaveService.removeUserByIdAsync: userId must be set";
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