var Q = require('q');
var from = require('fromjs');

var PlaylistsDirector = (function () {
	'use strict';

	function PlaylistsDirector (playlistDirector, playlistSaveService) {

		this.getPlaylistsAsync = function () {
			// TODO When we get should we update db for changes (load phys play, then see that they're changes and update db)?
			return playlistSaveService.getPlaylistsAsync();
		};

		this.getPlaylistsCountAsync = function () {
			return playlistSaveService.getPlaylistsCountAsync();
		};

		this.addVirtualPlaylistAsync = function (playlist) {
			return playlistSaveService
				.getPlaylistsCountAsync()
				.then(function(count) {
					playlist.index = count;
					return playlistSaveService.insertPlaylistAsync(playlist, count)
				});
		};

		this.insertVirtualPlaylistAsync = function (playlist, index) {
			return makeRoomForPlaylistAtIndex(index)
				.then(function() {
					return playlistSaveService.insertPlaylistAsync(playlist, index)
				});
		};

		this.movePlaylistsAsync = function (playlistIdIndexes, steps) { // TODO To be tested
			if (!playlistIdIndexes || !playlistIdIndexes.length || playlistIdIndexes.length == 0) {
				throw "playlists cannot be empty";
			}

			return playlistSaveService
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



//					for (var rowIndex = 0; rowIndex < playlistIdIndexes.length; rowIndex++) {
//					//for (var playlistIdIndex in playlistIdIndexes) {
//						var playlistIdToMove = playlistIdIndexes[rowIndex];
//
//						var currentIndex = plIds.indexOf(playlistIdToMove._id);
//
//						//for (var rowIndexPlToOffset = currentIndex; rowIndexPlToOffset < plIdIndexes.length; rowIndexPlToOffset++) {
//						//}
//						//delete plIds[currentIndex];
//						var newIndex = currentIndex + steps + 1;
//						plIds[newIndex] = {_id: playlistIdToMove._id, index: newIndex};
//					}

//					return from(plIds)
//						.where(function(plId) {
//							var actualIndex = plIdIndexes.indexOf(plId)
//							var newIndex = plIds.indexOf(plId);
//							return actualIndex != newIndex;
//						})
//						.toArray();
					return plIdIndexes_;
			})
			.then(function (plIdsToList) {
				return playlistSaveService.updatePlaylistIdsPositionAsync(plIdsToList)
			});
		};

		this.removePlaylistsAsync = function (playlistIds) {
			return playlistSaveService
				.findIndexesFromPlaylistIdsAsync(playlistIds)
				.then(assertOnPlaylistsNotFound)
				.then(getPlaylistsIdIndexToUpdateForReorder)
				.then(function(plIdLowIdSet) {
					if (plIdLowIdSet.lowerIds.length > 0) {
						return reorderLowerPlaylists(plIdLowIdSet, playlistIds);
					}
				})
				.then(function () {
					playlistSaveService.removePlaylistsByIdAsync(playlistIds)
				})
				.then(playlistSaveService.getPlaylistsAsync);
		};

		this.moveMediasToPlaylistAsync = function (srcPlaylistId, mediaIds, destPlaylistId) {
		};

		this.copyMediasToPlaylistAsync = function (srcPlaylistId, mediaIds, destPlaylistId) {
		};

		function makeRoomForPlaylistAtIndex (desiredIndex) {
			return playlistSaveService
				.getPlaylistsCountAsync()
				.then(function(count) {
					if (desiredIndex == null) {
						desiredIndex = count;
					} else if (desiredIndex > count || desiredIndex < 0) {
						throw "The given index is out of bounds";
					}

					// If we insert between playlists, then move below playlist down by one.
					if (desiredIndex < count) {
						return playlistSaveService
							.getPlaylistIdsLowerThanAsync(desiredIndex, true)
							.then(function(plIdIndexesToOffset) {
								var steps = 1;
								for (var index = 0; index < plIdIndexesToOffset.length; index++) {
									plIdIndexesToOffset[index].index += steps;
								}
								return plIdIndexesToOffset;
							})
							.then(function (plIdIndexesToOffset) {
								return playlistSaveService.updatePlaylistIdsPositionAsync(plIdIndexesToOffset)
							});
					}
				});
		}

		function reorderLowerPlaylists (plIdLowerSet, playlistIdsToRemove) {
			var index = plIdLowerSet.lowestIndex;

			var plIdReordered = from(plIdLowerSet.lowerIds)
				.where(function(lowerId) {
					return playlistIdsToRemove.indexOf(lowerId._id) == -1; // Only increment playlists not to be deleted
				})
				.select(function(lowerId) {
					return { _id: lowerId._id, index: index++ }
				})
				.toArray();

			return playlistSaveService.updatePlaylistIdsPositionAsync(plIdReordered);
		}

		function getPlaylistsIdIndexToUpdateForReorder (playlistIdIndexes) {
			var lowestIndex = from(playlistIdIndexes).select(function(x) {return x.index}).min();

			var deferred = Q.defer();
			playlistSaveService
				.getPlaylistIdsLowerThanAsync(lowestIndex, false)
				.then(function(plIdsLower) {
					deferred.resolve( { lowerIds: plIdsLower, lowestIndex: lowestIndex });
				});
			return deferred.promise;
		}

		function assertOnPlaylistsNotFound(playlistIds) {
			if (!playlistIds || playlistIds.length == 0) {
				throw "No playlists have been found";
			}
			return playlistIds;
		}
	}

	return PlaylistsDirector;
})();

module.exports = PlaylistsDirector;