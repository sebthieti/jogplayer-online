'use strict';

var Q = require('q');

var _saveService,
	UserState;

function UserStateSaveService(saveService, userStateModel) {
	_saveService = saveService;
	UserState = userStateModel;
}

UserStateSaveService.prototype.getUserStateAsync = function(ownerId) {
	var defer = Q.defer();
	
	UserState.findOne({ ownerId: ownerId})
		.exec(function(err, user) {
			if (err) { defer.reject(err) }
			else { defer.resolve(user) }
		});
	
	return defer.promise;
};

UserStateSaveService.prototype.addUserStateAsync = function (userId, state) {
	if (!userId) {
		throw new Error('SetupSaveService.addUserStateAsync: userId must be set');
	}
	if (!state) {
		throw new Error('SetupSaveService.addUserStateAsync: state must be set');
	}

	var defer = Q.defer();

	UserState.create({
		ownerId: userId,
		playedPosition: state.playedPosition,
		volume: state.volume,
		mediaQueue: state.mediaQueue,
		browsingFolderPath: state.browsingFolderPath,
		openedPlaylistId: state.openedPlaylistId,
		playingMediumInQueueIndex: state.playingMediumInQueueIndex
	}, function(err, newUserState) {
		if (err) { defer.reject(err) }
		else { defer.resolve(newUserState) }
	});

	return defer.promise;
};

UserStateSaveService.prototype.updateFromUserStateDtoAsync = function (userStateId, ownerId, userStateDto) {
	if (!ownerId) {
		throw new Error('SetupSaveService.updateFromUserStateDtoAsync: ownerId must be set');
	}
	if (!userStateDto) {
		throw new Error('SetupSaveService.updateFromUserStateDtoAsync: userStateDto must be set');
	}

	var defer = Q.defer();

	UserState.findOneAndUpdate(
		{ _id: userStateId, ownerId: ownerId },
		userStateDto.getDefinedFields(),
		function(err, user) {
			if (err) { defer.reject(err) }
			else { defer.resolve(user) }
		}
	);

	return defer.promise;
};

UserStateSaveService.prototype.removeUserStateByIdAsync = function (userId) {
	if (!userId) {
		throw new Error('SetupSaveService.removeUserStateByIdAsync: userId must be set');
	}

	var defer = Q.defer();

	UserState.findOneAndRemove(
		{ ownerId: userId },
		function(err) {
			if (err) { defer.reject(err) }
			else { defer.resolve() }
		}
	);

	return defer.promise;
};

module.exports = UserStateSaveService;