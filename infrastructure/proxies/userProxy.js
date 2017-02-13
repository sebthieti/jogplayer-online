var Q = require('q');

var _userSaveService,
	_globalCache = require("./").Cache;

const USERS_BY_NAME = "users.name",
	USERS_BY_ID = "users.id";

function UserProxy(userSaveService) {
	_userSaveService = userSaveService;
}

UserProxy.prototype.getUserByUsernameWithPermissionsAsync = function(username) {
	var deferred = Q.defer();

	var userFromCache = _globalCache.getItemFromCache(
		USERS_BY_NAME,
		username
	);
	if (userFromCache != null) {
		deferred.resolve(userFromCache);
	} else {
		_userSaveService
			.getUserByUsernameWithPermissionsAsync(username)
			.then(function(user) {
				_globalCache.createOrUpdateItem(
					USERS_BY_NAME,
					username,
					user
				);
				deferred.resolve(user);
			}, function(err) {
				deferred.reject(err);
			});
	}

	return deferred.promise;
};

UserProxy.prototype.getUserByIdWithPermissionsAsync = function(userId) {
	var deferred = Q.defer();

	var userFromCache = _globalCache.getItemFromCache(
		USERS_BY_ID,
		userId
	);
	if (userFromCache != null) {
		deferred.resolve(userFromCache);
	} else {
		_userSaveService
			.getUserByIdWithPermissionsAsync(userId)
			.then(function(user) {
				_globalCache.createOrUpdateItem(
					USERS_BY_ID,
					userId,
					user
				);
				deferred.resolve(user);
			}, function(err) {
				deferred.reject(err);
			});
	}

	return deferred.promise;
};

UserProxy.prototype.addUserPermissionsAsync = function(userId, userPermissionsModel, issuer) {
	var self = this;
	return _userSaveService
		.addUserPermissionsAsync(userId, userPermissionsModel, issuer)
		.then(function(userPermissionsModel) {
			self.invalidateUsers();
			return userPermissionsModel;
		});
};

UserProxy.prototype.addRootUserAsync = function(rootUserDto, userPermissionsModel) {
	return _userSaveService
		.addRootUserAsync(rootUserDto, userPermissionsModel)
		.then(function(user) {
			return _userSaveService.getUserByIdWithPermissionsAsync(user.id);
		})
		.then(function(user) {
			_globalCache.createOrUpdateItem(USERS_BY_ID, user.id, user);
			_globalCache.createOrUpdateItem(USERS_BY_NAME, user.username, user);
			return user;
		});
};

UserProxy.prototype.addUserAsync = function(userDto, userPermissionsModel, issuer) {
	return _userSaveService
		.addUserAsync(userDto, userPermissionsModel, issuer)
		.then(function(user) {
			return _userSaveService.getUserByIdWithPermissionsAsync(user.id);
		})
		.then(function(user) {
			_globalCache.createOrUpdateItem(USERS_BY_ID, user.id, user);
			_globalCache.createOrUpdateItem(USERS_BY_NAME, user.username, user);
			return user;
		});
};

UserProxy.prototype.updateFromUserDtoAsync = function(userId, userDto, issuer) {
	return _userSaveService
		.updateFromUserDtoAsync(userId, userDto, issuer)
		.then(function(user) {
			return _userSaveService.getUserByIdWithPermissionsAsync(user.id);
		})
		.then(function(user) {
			_globalCache.createOrUpdateItem(USERS_BY_ID, user.id, user);
			_globalCache.createOrUpdateItem(USERS_BY_NAME, user.username, user);
			return user;
		});
};

UserProxy.prototype.isRootUserSetAsync = function() {
	return _userSaveService.isRootUserSetAsync();
};

UserProxy.prototype.removeUserByIdAsync = function(userId, issuer) {
	var self = this;
	return _userSaveService
		.removeUserByIdAsync(userId, issuer)
		.then(function() {
			return self.invalidateUsers();
		});
};

UserProxy.prototype.invalidateUsers = function() {
	_globalCache.removeItemsInGroup(USERS_BY_ID);
	_globalCache.removeItemsInGroup(USERS_BY_NAME);
};

UserProxy.prototype.getUsersAsync = function() {
	return _userSaveService.getUsersAsync();
};

module.exports = UserProxy;