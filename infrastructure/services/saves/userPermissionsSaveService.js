'use strict';

var Q = require('q');

var _saveService,
	UserPermissions;

function UserPermissionsSaveService(saveService, userPermissionsModel) {
	_saveService = saveService;
	UserPermissions = userPermissionsModel;
}

UserPermissionsSaveService.prototype.getAllUserPermissionsAsync = function() {
	var defer = Q.defer();

	UserPermissions.find({})
		.exec(function(err, userPermissions) {
			if (err) { defer.reject(err) }
			else { defer.resolve(userPermissions) }
		});

	return defer.promise;
};

UserPermissionsSaveService.prototype.getUserPermissionsAsync = function(userId) { // TODO getUsersWithPermissionsAsync
	var defer = Q.defer();

	UserPermissions.find({ userId: userId })
		.exec(function(err, userPermissions) {
			if (err) { defer.reject(err) }
			else { defer.resolve(userPermissions) }
		});

	return defer.promise;
};

//UserPermissionsSaveService.prototype.addUserPermissionsAsync = function (userPermissions) {
//	if (!userPermissions) {
//		throw "UserPermissionsSaveService.addUserPermissionsAsync: userPermissions must be set";
//	}
//
//	var defer = Q.defer();
//
//	var userPermissionsFields = userPermissions.getDefinedFields();
//
//	UserPermissions.create(
//		userPermissionsFields,
//		function(err, newUserPermissions) {
//			if (err) { defer.reject(err) }
//			else { defer.resolve(newUserPermissions) }
//		});
//
//	return defer.promise;
//};

UserPermissionsSaveService.prototype.updateFromUserDtoAsync = function (userId, userDto, issuer) {
	if (!userDto) {
		throw "SetupSaveService.updateFromUserDtoAsync: user must be set";
	}
	if (!userId) {
		throw "SetupSaveService.updateFromUserDtoAsync: user.Id should be set";
	}

	var defer = Q.defer();

	UserPermissions.findOneAndUpdate(
		{ _id: userId }, // , ownerId: issuer.id
		userDto.getDefinedFields(),
		function(err, user) {
			if (err) { defer.reject(err) }
			else { defer.resolve(user) }
		}
	);

	return defer.promise;
};

UserPermissionsSaveService.prototype.removeUserByIdAsync = function (userId, issuer) {
	if (!userId) {
		throw "SetupSaveService.removeUserByIdAsync: userId must be set";
	}

	var defer = Q.defer();

	UserPermissions.findOneAndRemove(
		{ _id: userId },
		function(err) {
			if (err) { defer.reject(err) }
			else { defer.resolve() }
		}
	);

	return defer.promise;
};

module.exports = UserPermissionsSaveService;