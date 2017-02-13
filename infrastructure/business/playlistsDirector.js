var Q = require('q'),
	from = require('fromjs');

module.exports = (function () {
	'use strict';

	var _playlistDirector = null,
		_playlistSaveService = null;

	function PlaylistsDirector (playlistDirector, playlistSaveService) {
		_playlistDirector = playlistDirector;
		_playlistSaveService = playlistSaveService;
	}

	PlaylistsDirector.prototype.getPlaylistsAsync = function () {
		// TODO When we get should we update db for changes (load phys play, then see that they're changes and update db)?
		return _playlistSaveService.getPlaylistsAsync();
	};

	PlaylistsDirector.prototype.getPlaylistsCountAsync = function () {
		return _playlistSaveService.getPlaylistsCountAsync();
	};

	PlaylistsDirector.prototype.addPlaylistAsync = function (playlist) {
		if (!playlist.filePath || playlist.filePath == null) {
			return addVirtualPlaylistAsync(playlist);
		} else {
			return addPhysicalPlaylistAsync(playlist);
		}
	};

	PlaylistsDirector.prototype.insertPlaylistAsync = function (playlist, index) {
		if (!playlist.filePath || playlist.filePath == null) {
			return insertVirtualPlaylistAsync(playlist, index);
		} else {
			return insertPhysicalPlaylistAsync(playlist, index);
		}
	};

	PlaylistsDirector.prototype.movePlaylistsAsync = function (playlistIdIndexes, steps) { // TODO To be tested
		if (!playlistIdIndexes || !playlistIdIndexes.length || playlistIdIndexes.length == 0) {
			throw "playlists cannot be empty";
		}

		return _playlistSaveService
			.getPlaylistIdIndexesAsync()
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
				return _playlistSaveService.updatePlaylistIdsPositionAsync(plIdsToList)
			});
	};

	PlaylistsDirector.prototype.removePlaylistsAsync = function (playlistIds) {
		return _playlistSaveService
			.findIndexesFromPlaylistIdsAsync(playlistIds)
			.then(assertOnPlaylistsNotFound)
			.then(getPlaylistsIdIndexToUpdateForReorderAsync)
			.then(function(plIdLowIdSet) {
				if (plIdLowIdSet.lowerIds.length > 0) {
					return reorderLowerPlaylists(plIdLowIdSet, playlistIds);
				}
			})
			.then(function () {
				_playlistSaveService.removePlaylistsByIdAsync(playlistIds)
			})
			.then(_playlistSaveService.getPlaylistsAsync);
	};

	PlaylistsDirector.prototype.moveMediasToPlaylistAsync = function (srcPlaylistId, mediaIds, destPlaylistId) {
	};

	PlaylistsDirector.prototype.copyMediasToPlaylistAsync = function (srcPlaylistId, mediaIds, destPlaylistId) {
	};

	var addVirtualPlaylistAsync = function (playlist) {
		return _playlistSaveService
			.getPlaylistsCountAsync()
			.then(function(count) {
				playlist.index = count;
				return _playlistSaveService.insertPlaylistAsync(playlist, count)
			});
	};

	var addPhysicalPlaylistAsync = function (playlist) {
		return _playlistSaveService
			.getPlaylistsCountAsync()
			.then(function(count) {
				playlist.index = count;
				return _playlistSaveService.insertPlaylistAsync(playlist, count)
			});
	}; // TODO Should parse playlist but don't return it's content. there's the playlistDirector for that

	var insertVirtualPlaylistAsync = function (playlist, index) {
		return makeRoomForPlaylistAtIndex(index)
			.then(function() {
				return _playlistSaveService.insertPlaylistAsync(playlist, index)
			});
	};

	var insertPhysicalPlaylistAsync = function (playlist, index) {
	}; // TODO Should parse playlist but don't return it's content. there's the playlistDirector for that

	var makeRoomForPlaylistAtIndex = function (desiredIndex) {
		return _playlistSaveService
			.getPlaylistsCountAsync()
			.then(function(count) {
				if (desiredIndex == null) {
					desiredIndex = count;
				} else if (desiredIndex > count || desiredIndex < 0) {
					throw "The given index is out of bounds";
				}

				// If we insert between playlists, then move below playlist down by one.
				if (desiredIndex < count) {
					return _playlistSaveService
						.getPlaylistIdsLowerThanAsync(desiredIndex, true)
						.then(function(plIdIndexesToOffset) {
							var steps = 1;
							for (var index = 0; index < plIdIndexesToOffset.length; index++) {
								plIdIndexesToOffset[index].index += steps;
							}
							return plIdIndexesToOffset;
						})
						.then(function (plIdIndexesToOffset) {
							return _playlistSaveService.updatePlaylistIdsPositionAsync(plIdIndexesToOffset)
						});
				}
			});
	};

	var reorderLowerPlaylists = function (plIdLowerSet, playlistIdsToRemove) {
		var index = plIdLowerSet.lowestIndex;

		var plIdReordered = from(plIdLowerSet.lowerIds)
			.where(function(lowerId) {
				return playlistIdsToRemove.indexOf(lowerId._id) == -1; // Only increment playlists not to be deleted
			})
			.select(function(lowerId) {
				return { _id: lowerId._id, index: index++ }
			})
			.toArray();

		return _playlistSaveService.updatePlaylistIdsPositionAsync(plIdReordered);
	};

	var getPlaylistsIdIndexToUpdateForReorderAsync = function (playlistIdIndexes) {
		var lowestIndex = from(playlistIdIndexes).select(function(x) {return x.index}).min();

		var deferred = Q.defer();
		_playlistSaveService
			.getPlaylistIdsLowerThanAsync(lowestIndex, false)
			.then(function(plIdsLower) {
				deferred.resolve( { lowerIds: plIdsLower, lowestIndex: lowestIndex });
			});
		return deferred.promise;
	};

	var assertOnPlaylistsNotFound = function (playlistIds) {
		if (!playlistIds || playlistIds.length == 0) {
			throw "No playlists have been found";
		}
		return playlistIds;
	};

	return PlaylistsDirector;
})();