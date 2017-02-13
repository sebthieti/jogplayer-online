var Q = require("q");

var _userStateSaveService,
	_globalCache = require("./").Cache;

const USER_STATE = "user.state";

function UserStateProxy (userStateSaveService) {
	_userStateSaveService = userStateSaveService;
}

UserStateProxy.prototype.getUserStateAsync = function(userId) {
	var deferred = Q.defer();

	var userState = _globalCache.getItemFromCache(
		USER_STATE,
		userId
	);
	if (userState != null) {
		deferred.resolve(userState);
	} else {
		_userStateSaveService
			.getUserStateAsync(userId)
			.then(function(userState) {
				_globalCache.createOrUpdateItem(
					USER_STATE,
					userId,
					userState
				);
				deferred.resolve(userState);
			}, function(err) {
				deferred.reject(err);
			});
	}

	return deferred.promise;
};

UserStateProxy.prototype.addUserStateAsync = function(issuerId, userStateDto) {
	return _userStateSaveService
		.addUserStateAsync(issuerId, userStateDto)
		.then(function(userState) {
			_globalCache.createOrUpdateItem(
				USER_STATE,
				issuerId,
				userState
			);
			return userState;
		});
};

UserStateProxy.prototype.updateFromUserStateDtoAsync = function(userStateId, issuerId, userStateDto) {
	return _userStateSaveService
		.updateFromUserStateDtoAsync(userStateId, issuerId, userStateDto)
		.then(function(userState) {
			_globalCache.createOrUpdateItem(
				USER_STATE,
				issuerId,
				userState
			);
			return userState;
		});
};

UserStateProxy.prototype.removeUserStateByIdAsync = function (userId) {
	return _userStateSaveService
		.removeUserStateByIdAsync(userId)
		.then(function() {
			_globalCache.removeItem(USER_STATE, userId);
		});
};

module.exports = UserStateProxy;