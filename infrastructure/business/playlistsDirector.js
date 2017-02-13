'use strict';

var Q = require('q'),
	from = require('fromjs');

var _playlistDirector,
	_physicalPlaylistServices,
	_playlistSaveService,
	_playlistBuilder,
	_playlistsProxy;

function PlaylistsDirector(playlistsProxy, playlistDirector, physicalPlaylistServices, playlistSaveService, playlistBuilder) {
	_playlistsProxy = playlistsProxy;
	_playlistDirector = playlistDirector;
	_physicalPlaylistServices = physicalPlaylistServices;
	_playlistSaveService = playlistSaveService;
	_playlistBuilder = playlistBuilder
}

var assertOnPlaylistNotFound = function (playlist) {
	if (!playlist) {
		throw "No playlist has been found";
	}
	return playlist;
};

var getPlaylistsAsync = function (issuer) {
	return _playlistsProxy.getPlaylistsAsync(issuer);
};

// BEGIN Add/Insert Playlist

var addPlaylistAsync = function (playlistDto, issuer) {
	return insertPlaylistAsync(playlistDto, issuer, null);
};

var insertPlaylistAsync = function (playlistDto, issuer, index) {
	var prepareAndGetPosition;
	if (!index) { // We'll append medium
		prepareAndGetPosition = _playlistsProxy.getPlaylistsCountAsync(issuer);
	} else {
		prepareAndGetPosition = makeRoomForPlaylistAtIndexAsync(index, issuer)
			.then(function() { return index });
	}

	return prepareAndGetPosition
		.then(function(position) {
			return playlistDto.isVirtual()
				? buildAndInsertVirtualPlaylistAsync(playlistDto, position, issuer)
				: buildAndInsertPhysicalPlaylistAsync(playlistDto, position, issuer);
		});
};

var buildAndInsertVirtualPlaylistAsync = function (playlistDto, index, issuer) {
	var emptyPlaylist = _playlistBuilder.buildEmptyVirtualPlaylist(playlistDto.name, index, issuer);
	return _playlistsProxy.saveNewPlaylist(emptyPlaylist, issuer);//utils.saveModelAsync(emptyPlaylist);
};

var buildAndInsertPhysicalPlaylistAsync = function (playlistDto, index, issuer) {
	return buildAndInsertEmptyPlaylistFromDtoAsync(playlistDto, index, issuer)
		.then(function(emptyPlaylist) {
			return _playlistDirector.feedPhysicalPlaylistWithMediaAndSaveAsync(emptyPlaylist, issuer);
		});
};

var buildAndInsertEmptyPlaylistFromDtoAsync = function(dtoPlaylist, index, issuer) {
	return _playlistBuilder.buildEmptyPhysicalPlaylistAsync(
		dtoPlaylist.filePath,
		dtoPlaylist.name,
		index,
		issuer
	).then(function(emptyPlaylist) {
		return _playlistsProxy.saveNewPlaylist(emptyPlaylist);//utils.saveModelAsync(emptyPlaylist);
	});
};

var makeRoomForPlaylistAtIndexAsync = function (desiredIndex, issuer) {
	return _playlistsProxy
		.getPlaylistsCountAsync(issuer)
		.then(function(count) {
			if (desiredIndex == null) {
				desiredIndex = count;
			} else if (desiredIndex > count || desiredIndex < 0) {
				throw "The given index is out of bounds";
			}

			// If we insert between playlists, then move below playlist down by one.
			if (desiredIndex < count) {
				return _playlistsProxy
					.getPlaylistIdsLowerThanAsync(desiredIndex, true, issuer)
					.then(function(plIdIndexesToOffset) {
						var steps = 1;
						for (var index = 0; index < plIdIndexesToOffset.length; index++) {
							plIdIndexesToOffset[index].index += steps;
						}
						return plIdIndexesToOffset;
					})
					.then(function (plIdIndexesToOffset) {
						return _playlistSaveService.updatePlaylistIdsPositionAsync(plIdIndexesToOffset, issuer)
					});
			}
		});
};

// END Add/Insert Playlist

var movePlaylistsAsync = function (playlistIdIndexes, steps, issuer) { // TODO To be tested
	if (!playlistIdIndexes || !playlistIdIndexes.length || playlistIdIndexes.length == 0) {
		throw "playlists cannot be empty";
	}

	return _playlistsProxy
		.getPlaylistIdIndexesAsync(issuer)
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
			return _playlistSaveService.updatePlaylistIdsPositionAsync(plIdsToList, issuer)
		});
};

var moveMediasToPlaylistAsync = function (srcPlaylistId, mediaIds, destPlaylistId, issuer) { // TODO
};

var removePlaylistAsync = function (playlistId, issuer) {
	return _playlistSaveService
		.findIndexFromPlaylistIdAsync(playlistId, issuer)
		.then(assertOnPlaylistNotFound)
		.then(function(playlist) { // TODO This parameter is a playlist or an Index ??
			return getPlaylistsIdIndexToUpdateForReorderAsync(playlist, issuer);
		})
		.then(function(plIdLowIdSet) {
			if (plIdLowIdSet.lowerIds.length > 0) {
				return reorderLowerPlaylists(plIdLowIdSet, playlistId, issuer);
			}
		})
		.then(function () {
			return _playlistsProxy.removePlaylistByIdAsync(playlistId, issuer)
		});
};

var getPlaylistsIdIndexToUpdateForReorderAsync = function (playlist, issuer) {
	var lowestIndex = playlist.index;

	var deferred = Q.defer();
	_playlistsProxy
		.getPlaylistIdsLowerThanAsync(lowestIndex, false, issuer)
		.then(function(plIdsLower) {
			deferred.resolve( { lowerIds: plIdsLower, lowestIndex: lowestIndex });
		});
	return deferred.promise;
};

var reorderLowerPlaylists = function (plIdLowerSet, playlistIdsToRemove, issuer) {
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

	return _playlistSaveService.updatePlaylistIdsPositionAsync(plIdReordered, issuer);
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