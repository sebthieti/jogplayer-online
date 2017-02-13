'use strict';

var Q = require('q');

var _saveService,
	User;

function UserSaveService(saveService, userModel) {
	_saveService = saveService;
	User = userModel;
}

UserSaveService.prototype.getUsersAsync = function() {
	var defer = Q.defer();

	User.find({})
		.exec(function(err, users) {
			if (err) { defer.reject(err) }
			else { defer.resolve(users) }
		});

	return defer.promise;
};

UserSaveService.prototype.getUserByIdAsync = function(userId) {
	var defer = Q.defer();

	User.findOne({ _id: userId})
		.exec(function(err, user) {
			if (err) { defer.reject(err) }
			else { defer.resolve(user) }
		});

	return defer.promise;
};

UserSaveService.prototype.getUserByUsernameAsync = function(username) {
	var defer = Q.defer();

	User.findOne({ username: username})
		.exec(function(err, user) {
			if (err) { defer.reject(err) }
			else { defer.resolve(user) }
		});

	return defer.promise;
};

UserSaveService.prototype.addUserAsync = function (user, owner) {
	if (!user) {
		throw "UserSaveService.addUserAsync: favorite must be set";
	}
	if (!owner) {
		throw "UserSaveService.addUserAsync: owner must be set";
	}
	if (user._id) {
		throw "UserSaveService.addUserAsync: user.Id should not be set";
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

UserSaveService.prototype.updateFromUserDtoAsync = function (userId, userDto, owner) {
	if (!userDto) {
		throw "UserSaveService.updateFromUserDtoAsync: user must be set";
	}
	if (!userId) {
		throw "UserSaveService.updateFromUserDtoAsync: user.Id should be set";
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
		throw "UserSaveService.removeUserByIdAsync: userId must be set";
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