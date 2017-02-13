'use strict';

var Q = require('q'),
	from = require('fromjs')/*,
	playlistBuilder = require('../invokers').playlistBuilder*/;

var _playlistDirector,
	_physicalPlaylistServices,
	_playlistSaveService,
	_playlistBuilder;

var addVirtualPlaylistAsync = function (dtoPlaylist) {
	return _playlistSaveService
		.getPlaylistsCountAsync()
		.then(function(count) {
			var playlist = _playlistBuilder.buildEmptyVirtualPlaylist(dtoPlaylist.name, count);
			return _playlistSaveService.insertPlaylistAsync(playlist, count);
		});
};

var addPhysicalPlaylistAsync = function (dtoPlaylist) {
	return _playlistSaveService
		.getPlaylistsCountAsync()
		.then(function(count) { // Create playlist
			var playlist = _playlistBuilder.buildEmptyPhysicalPlaylist(dtoPlaylist.filePath, dtoPlaylist.name, count);
			playlist.index = count;
			return _playlistSaveService.insertPlaylistAsync(playlist, playlist.index);
		})
		.then(function(playlist) {
			return _playlistDirector
				.getMediaFromPlaylist(playlist)
				.then(function(media) {
					return { media: media, playlist: playlist };
				});
		})
		.then(function(result) {
			return _playlistDirector
				.addMediaAsync(result.playlist.id, result.media)
				.then(function(media) {
					return { media: media, playlist: result.playlist };
				});
		})
		.then(function(result) { // TODO Refactor that logic to playlistDirector
			result.playlist.media = result.media;
			return _playlistSaveService.updatePlaylistAsync(result.playlist.id, result.playlist);
		});
}; // TODO Should parse playlist but don't return it's content. there's the playlistDirector for that

var insertVirtualPlaylistAsync = function (playlist, index) {
	return makeRoomForPlaylistAtIndex(index)
		.then(function() {
			return _playlistSaveService.insertPlaylistAsync(playlist, index);
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

var PlaylistsDirector = function (playlistDirector, physicalPlaylistServices, playlistSaveService, playlistBuilder) {
	_playlistDirector = playlistDirector;
	_physicalPlaylistServices = physicalPlaylistServices;
	_playlistSaveService = playlistSaveService;
	_playlistBuilder = playlistBuilder
};

PlaylistsDirector.prototype = {

	getPlaylistsAsync: function () {
		// TODO When we get should we update db for changes (load phys play, then see that they're changes and update db)?
		return _playlistSaveService.getPlaylistsAsync();
	},

	getPlaylistsCountAsync: function () {
		return _playlistSaveService.getPlaylistsCountAsync();
	},

	addPlaylistAsync: function (playlist) {
		if (!playlist.filePath || playlist.filePath == null) {
			return addVirtualPlaylistAsync(playlist);
		} else {
			return addPhysicalPlaylistAsync(playlist);
		}
	},

	insertPlaylistAsync: function (playlist, index) {
		if (!playlist.filePath || playlist.filePath == null) {
			return insertVirtualPlaylistAsync(playlist, index);
		} else {
			return insertPhysicalPlaylistAsync(playlist, index);
		}
	},

	movePlaylistsAsync: function (playlistIdIndexes, steps) { // TODO To be tested
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
	},

	moveMediasToPlaylistAsync: function (srcPlaylistId, mediaIds, destPlaylistId) {
	},

	updatePlaylistAsync: function(playlistId, playlist) {
		return _playlistSaveService
			.findIndexesFromPlaylistIdsAsync([ playlistId ])
			.then(assertOnPlaylistsNotFound)
			.then(function () {
				return _playlistSaveService.updatePlaylistAsync(playlistId, playlist);
			});
	},

	removePlaylistsAsync: function (playlistIds) {
		return _playlistSaveService // TODO Remove pl should only remove one at a time
			.findIndexesFromPlaylistIdsAsync(playlistIds)
			.then(assertOnPlaylistsNotFound)
			.then(getPlaylistsIdIndexToUpdateForReorderAsync)
			.then(function(plIdLowIdSet) {
				if (plIdLowIdSet.lowerIds.length > 0) {
					return reorderLowerPlaylists(plIdLowIdSet, playlistIds);
				}
			})
			.then(function () {
				return _playlistSaveService.removePlaylistsByIdAsync(playlistIds)
			});
	},

	copyMediasToPlaylistAsync: function (srcPlaylistId, mediaIds, destPlaylistId) {
	}

};

module.exports = PlaylistsDirector;