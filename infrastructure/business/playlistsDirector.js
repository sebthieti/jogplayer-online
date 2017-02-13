'use strict';

var Q = require('q'),
	from = require('fromjs'),
	utils = require('../utils');

var _playlistDirector,
	_physicalPlaylistServices,
	_playlistSaveService,
	_playlistBuilder;

var assertOnPlaylistNotFound = function (playlist) {
	if (!playlist) {
		throw "No playlist has been found";
	}
	return playlist;
};

var getPlaylistsAsync = function (owner) {
	return _playlistSaveService.getPlaylistsAsync(owner);
};

// BEGIN Add/Insert Playlist

var addPlaylistAsync = function (playlistDto, owner) {
	return insertPlaylistAsync(playlistDto, owner, null);
};

var insertPlaylistAsync = function (playlistDto, owner, index) {
	var prepareAndGetPosition;
	if (!index) { // We'll append medium
		prepareAndGetPosition = _playlistSaveService.getPlaylistsCountAsync(owner);
	} else {
		prepareAndGetPosition = makeRoomForPlaylistAtIndexAsync(index, owner)
			.then(function() { return index });
	}

	return prepareAndGetPosition
		.then(function(position) {
			return playlistDto.isVirtual()
				? buildAndInsertVirtualPlaylistAsync(playlistDto, position, owner)
				: buildAndInsertPhysicalPlaylistAsync(playlistDto, position, owner);
		});
};

var buildAndInsertVirtualPlaylistAsync = function (playlistDto, index, owner) {
	var emptyPlaylist = _playlistBuilder.buildEmptyVirtualPlaylist(playlistDto.name, index, owner);
	return utils.saveModelAsync(emptyPlaylist);
};

var buildAndInsertPhysicalPlaylistAsync = function (playlistDto, index, owner) {
	return buildAndInsertEmptyPlaylistFromDtoAsync(playlistDto, index, owner)
		.then(function(emptyPlaylist) {
			return _playlistDirector.feedPhysicalPlaylistWithMediaAndSaveAsync(emptyPlaylist, owner);
		});
};

var buildAndInsertEmptyPlaylistFromDtoAsync = function(dtoPlaylist, index, owner) {
	return _playlistBuilder.buildEmptyPhysicalPlaylistAsync(
		dtoPlaylist.filePath,
		dtoPlaylist.name,
		index,
		owner
	).then(function(emptyPlaylist) {
		return utils.saveModelAsync(emptyPlaylist);
	});
};

var makeRoomForPlaylistAtIndexAsync = function (desiredIndex, owner) {
	return _playlistSaveService
		.getPlaylistsCountAsync(owner)
		.then(function(count) {
			if (desiredIndex == null) {
				desiredIndex = count;
			} else if (desiredIndex > count || desiredIndex < 0) {
				throw "The given index is out of bounds";
			}

			// If we insert between playlists, then move below playlist down by one.
			if (desiredIndex < count) {
				return _playlistSaveService
					.getPlaylistIdsLowerThanAsync(desiredIndex, true, owner)
					.then(function(plIdIndexesToOffset) {
						var steps = 1;
						for (var index = 0; index < plIdIndexesToOffset.length; index++) {
							plIdIndexesToOffset[index].index += steps;
						}
						return plIdIndexesToOffset;
					})
					.then(function (plIdIndexesToOffset) {
						return _playlistSaveService.updatePlaylistIdsPositionAsync(plIdIndexesToOffset, owner)
					});
			}
		});
};

// END Add/Insert Playlist

var movePlaylistsAsync = function (playlistIdIndexes, steps, owner) { // TODO To be tested
	if (!playlistIdIndexes || !playlistIdIndexes.length || playlistIdIndexes.length == 0) {
		throw "playlists cannot be empty";
	}

	return _playlistSaveService
		.getPlaylistIdIndexesAsync(owner)
		.then(function (plIdIndexes) {
			var lowerIndex = from(plIdIndexes).select(function(x) {return x.index}).min();
			var higherIndex = from(plIdIndexes).select(function(x) {return x.index}).max();

			var isValidLowerBound = lowerIndex + steps >= 0;
			var isValidUpperBound = higherIndex + steps <= plIdIndexes.length;
			if (!isValidLowerBound || !isValidUpperBound) {
				throw "steps value is outer bounds";
			}

			var plIds = from(plIdIndexes).select(function(x) {return x._id.toString()}).toArray();

			var plIdIndexes_ = plIdIndexes.slice();

			if (steps > 0) {

				var mediaIndexes = [];
				for (var rowIndex = playlistIdIndexes.length - 1; rowIndex >= 0; rowIndex--) {
					mediaIndexes.push(playlistIdIndexes[rowIndex]);

					var media1ToSwapIndex = playlistIdIndexes[rowIndex];
					var media2ToSwapIndex = playlistIdIndexes[rowIndex] + 1;

					for (var moveIndex = 0; moveIndex < steps; moveIndex++, media1ToSwapIndex++, media2ToSwapIndex++) {
						var media1IdIndex = plIdIndexes_[media1ToSwapIndex];
						media1IdIndex.index = media2ToSwapIndex;

						var media2IdIndex = plIdIndexes_[media2ToSwapIndex];
						media2IdIndex.index = media1ToSwapIndex;

						plIdIndexes_[media1ToSwapIndex] = media2IdIndex;
						plIdIndexes_[media2ToSwapIndex] = media1IdIndex;
					}
				}

			} else {
			}

			//for (var rowIndex = 0; rowIndex < playlistIdIndexes.length; rowIndex++) {
			////for (var playlistIdIndex in playlistIdIndexes) {
			//	var playlistIdToMove = playlistIdIndexes[rowIndex];
			//
			//	var currentIndex = plIds.indexOf(playlistIdToMove._id);
			//
			//	//for (var rowIndexPlToOffset = currentIndex; rowIndexPlToOffset < plIdIndexes.length; rowIndexPlToOffset++) {
			//	//}
			//	//delete plIds[currentIndex];
			//	var newIndex = currentIndex + steps + 1;
			//	plIds[newIndex] = {_id: playlistIdToMove._id, index: newIndex};
			//}

			//return from(plIds)
			//	.where(function(plId) {
			//		var actualIndex = plIdIndexes.indexOf(plId)
			//		var newIndex = plIds.indexOf(plId);
			//		return actualIndex != newIndex;
			//	})
			//	.toArray();
			return plIdIndexes_;
		})
		.then(function (plIdsToList) {
			return _playlistSaveService.updatePlaylistIdsPositionAsync(plIdsToList, owner)
		});
};

var moveMediasToPlaylistAsync = function (srcPlaylistId, mediaIds, destPlaylistId, owner) { // TODO
};

var removePlaylistAsync = function (playlistId, owner) {
	return _playlistSaveService
		.findIndexFromPlaylistIdAsync(playlistId, owner)
		.then(assertOnPlaylistNotFound)
		.then(function(playlist) { // TODO This parameter is a playlist or an Index ??
			return getPlaylistsIdIndexToUpdateForReorderAsync(playlist, owner);
		})
		.then(function(plIdLowIdSet) {
			if (plIdLowIdSet.lowerIds.length > 0) {
				return reorderLowerPlaylists(plIdLowIdSet, playlistId, owner);
			}
		})
		.then(function () {
			return _playlistSaveService.removePlaylistByIdAsync(playlistId, owner)
		});
};

var getPlaylistsIdIndexToUpdateForReorderAsync = function (playlist, owner) {
	var lowestIndex = playlist.index;

	var deferred = Q.defer();
	_playlistSaveService
		.getPlaylistIdsLowerThanAsync(lowestIndex, false, owner)
		.then(function(plIdsLower) {
			deferred.resolve( { lowerIds: plIdsLower, lowestIndex: lowestIndex });
		});
	return deferred.promise;
};

var reorderLowerPlaylists = function (plIdLowerSet, playlistIdsToRemove, owner) {
	var index = plIdLowerSet.lowestIndex;

	var plIdReordered = from(plIdLowerSet.lowerIds)
		.where(function(lowerId) {
			// Only increment playlists not to be deleted
			return playlistIdsToRemove.indexOf(lowerId._id) == -1;
		})
		.select(function(lowerId) {
			return { _id: lowerId._id, index: index++ }
		})
		.toArray();

	return _playlistSaveService.updatePlaylistIdsPositionAsync(plIdReordered, owner);
};

var PlaylistsDirector = function (playlistDirector, physicalPlaylistServices, playlistSaveService, playlistBuilder) {
	_playlistDirector = playlistDirector;
	_physicalPlaylistServices = physicalPlaylistServices;
	_playlistSaveService = playlistSaveService;
	_playlistBuilder = playlistBuilder
};

PlaylistsDirector.prototype = {
	getPlaylistsAsync: getPlaylistsAsync,

	addPlaylistAsync: addPlaylistAsync,
	insertPlaylistAsync: insertPlaylistAsync,

	movePlaylistsAsync: movePlaylistsAsync,
	moveMediasToPlaylistAsync: moveMediasToPlaylistAsync,

	removePlaylistAsync: removePlaylistAsync
};

module.exports = PlaylistsDirector;