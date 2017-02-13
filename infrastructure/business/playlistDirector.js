'use strict';

var fs = require('fs'),
	Q = require('q'),
	from = require('fromjs'),
	_ = require('underscore'),
	utils = require('../utils');

var _fileExplorerService,
	_physicalPlaylistServices,
	_playlistSaveService,
	_mediaSaveService,
	_mediaService,
	_mediaBuilder,
	_mediaDirector;

var assertOnNotFound = function(data) {
	if (data === undefined || data === null) { throw "No data has been found" }
	return data;
};

var findPhysicalPlaylistServiceFor = function(plFilePath) {
	return from(_physicalPlaylistServices)
		.first(function (svc) { return svc.isOfType(plFilePath) });
};

// BEGIN Get media from playlist

var getMediaFromPlaylistByIdAsync = function (playlistId) {
	return _playlistSaveService
		.getPlaylistWithMediaAsync(playlistId)
		.then(assertOnNotFound)
		.then(function (playlist) {
			if (playlist.isVirtual) {
				// A virtual playlist won't change outside (compared to physical)
				return { playlist: playlist, reloaded: false };
			} else {
				return ifPhysicalPlaylistChangeThenUpdateAsync(playlist);
			}
		})
		.then(ifPlaylistNotReloadedCheckMediaAvailabilityAsync)
		.then(function(pl) {
			return pl.media;
		});
};

var ifPlaylistNotReloadedCheckMediaAvailabilityAsync = function(plReloadedSet) {

	var checkAndUpdatePromises = plReloadedSet.playlist.media.map(function(medium) {
		return utils.checkFileExistsAsync(medium.filePath)
			.then(function (fileExists) {
				// TODO Move this to Model when Mongoose doc comes up (move hasChanged to model). isAvailable shouldn't be stored
				var isAvailableChanged = medium.isAvailable !== fileExists;
				if (isAvailableChanged) {
					return {
						medium: medium.setIsAvailable(fileExists),
						hasChanged: isAvailableChanged
					};
				}
				return {
					medium: medium,
					hasChanged: isAvailableChanged
				};
			});
	});

	return Q.all(checkAndUpdatePromises)
		.then(function(mediaHasChangedSet) {
			// Filter the ones to update
			var mediaToUpdate = from(mediaHasChangedSet)
				.where(function(mediumHasChanged) {
					return mediumHasChanged.hasChanged;
				})
				.select(function(mediumHasChanged) {
					return mediumHasChanged.medium;
				})
				.toArray();

			var mediaToUpdatePromises = mediaToUpdate.map(function(medium) {
				return utils.saveModelAsync(medium);
			});

			return Q.all(mediaToUpdatePromises);
		})
		.then(function() {
			return plReloadedSet.playlist;
		});
};

var ifPhysicalPlaylistChangeThenUpdateAsync = function (playlist) {
	return Q
		.nfcall(fs.stat, playlist.filePath)
		.then(function(stat) {
			var lastUpdateOn = stat.mtime;
			if (playlistHasChanged(playlist.updatedOn, lastUpdateOn)) {
				return updatePlaylistDateReloadMediaAndSaveAsync(playlist, lastUpdateOn)
					.then(function(pl) {
						return { playlist: pl, reloaded: true }
					});
			}
			return { playlist: playlist, reloaded: false };
		});
};

var updatePlaylistDateReloadMediaAndSaveAsync = function(playlist, lastUpdateOn) {
	return _playlistSaveService
		.removeAllMediaFromPlaylistAsync(playlist.id)
		.then(function(cleanPl) {
			return cleanPl.setUpdatedOn(lastUpdateOn);
		})
		.then(function(cleanPlUpdated) {
			return utils.saveModelAsync(cleanPlUpdated);
		})
		.then(feedPhysicalPlaylistWithMediaAndSaveAsync);
};

var playlistHasChanged = function(currentPlaylistUpdateDate, lastUpdateDate) {
	return lastUpdateDate > currentPlaylistUpdateDate;
};

// END Get media from playlist

// BEGIN Fill playlist: Load it's content, and return a fed playlist

var feedPhysicalPlaylistWithMediaAndSaveAsync = function(emptyPlaylist) {
	return loadMediaFromPhysicalPlaylistAsync(emptyPlaylist) // Should give new Pl with media not yet persisted
		.then(saveMediaAsync)
		.then(function(media) {
			return _playlistSaveService.insertMediaToPlaylistReturnSelfAsync(
				emptyPlaylist.id,
				media
			);
		});
};

var saveMediaAsync = function (media) {
	var addMediaPromises = media.map(function(medium) {
		return utils.saveModelAsync(medium);
	});
	return Q.all(addMediaPromises);
};

var loadMediaFromPhysicalPlaylistAsync = function (emptyPlaylist) {
	if (!emptyPlaylist) {
		throw "PlaylistDirector.injectMediaToPhysicalPlaylistAsync: playlist must be set";
	}

	var filePath = emptyPlaylist.filePath;
	if (!filePath) {
		throw "PlaylistDirector.injectMediaToPhysicalPlaylistAsync: playlist.FilePath must be set";
	}

	var physicalPlaylistService = findPhysicalPlaylistServiceFor(filePath);
	if (!physicalPlaylistService) {
		throw "PlaylistDirector.injectMediaToPhysicalPlaylistAsync cannot load playlist of format: " + fs.extname(filePath);
	}

	var plId = emptyPlaylist.id;
	return physicalPlaylistService
		.loadMediaSummariesFromPlaylistAsync(filePath)
		.then(function(ms) { return _mediaBuilder.toMediaAsync(ms, plId) });
};

// END Fill playlist: Load it's content, and return a fed playlist

var updatePlaylistAsync = function(playlistId, playlistDto) {
	return _playlistSaveService.updatePlaylistDtoAsync(playlistId, playlistDto);
};

// BEGIN Add/Insert medium

var addMediumByFilePathAsync = function (playlistId, mediaFilePaths) {
	return insertMediumByFilePathAsync(playlistId, mediaFilePaths);
};

var insertMediumByFilePathAsync = function (playlistId, mediaFilePath, index) {
	var prepareAndGetPosition;
	if (!index) { // We'll append medium
		prepareAndGetPosition = _playlistSaveService.getMediaCountForPlaylistByIdAsync(playlistId);
	} else {
		prepareAndGetPosition = makeRoomForMediaAtIndexFromPlaylistIdAsync(playlistId, index)
			.then(function() { return index });
	}

	return prepareAndGetPosition
		.then(function(mediaPosition) {
			return buildAndInsertMediumByFilePathAsync(playlistId, mediaFilePath, mediaPosition);
		})
		.then(function(unlinkedMedium) {
			return _playlistSaveService.insertMediaToPlaylistAsync(playlistId, unlinkedMedium);
		})
		.then(function(linkedMedium) {
			return _playlistSaveService
				.getPlaylistWithMediaAsync(playlistId)
				.then(function(playlist) {
					// if virtual, then update file
					if (!playlist.isVirtual) {
						return findPhysicalPlaylistServiceFor(playlist.filePath)
							.savePlaylistAsync(playlist)
							.then(function() {
								return linkedMedium;
							})
					}
					return linkedMedium;
				});
		});
};

var buildAndInsertMediumByFilePathAsync = function (playlistId, mediaFilePath, desiredIndex) {
	mediaFilePath = _fileExplorerService.normalizePathForCurrentOs(mediaFilePath);
	return _mediaBuilder
		.buildMediumAsync(playlistId, mediaFilePath, desiredIndex)
		.then(utils.saveModelAsync);
};

var makeRoomForMediaAtIndexFromPlaylistIdAsync = function (playlistId, desiredIndex) {
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

// END Add/Insert medium

// BEGIN Remove medium

var removeMediaAsync = function (playlistId, mediaId) {
	return _mediaSaveService
		.findIndexFromMediaIdsAsync(mediaId)
		.then(assertOnNotFound)
		.then(function(mediaIndex) {
			return getMediaIdIndexToUpdateForReorderAsync(playlistId, mediaIndex);
		})
		.then(function(plIdLowIdSet) {
			if (plIdLowIdSet.lowerIds.length > 0) {
				return reorderLowerMedia(plIdLowIdSet, mediaId);
			}
		})
		.then(function () {
			return _playlistSaveService.removeMediaFromPlaylistAsync(playlistId, mediaId);
		});
};

var getMediaIdIndexToUpdateForReorderAsync = function (playlistId, mediaIndex) {
	return _playlistSaveService
		.getMediaIdsLowerThanAsync(playlistId, mediaIndex, false)
		.then(function(mediaIdsLower) {
			return { lowerIds: mediaIdsLower, lowestIndex: mediaIndex };
		});
};

var reorderLowerMedia = function (mediaIdsLowerSet, mediaIdToRemove) {
	var index = mediaIdsLowerSet.lowestIndex;

	var mediaIdsReordered = from(mediaIdsLowerSet.lowerIds)
		.where(function(lowerId) {
			// Only increment playlists not to be deleted
			return mediaIdToRemove !== String(lowerId);
		})
		.select(function(lowerId) {
			return { _id: lowerId, index: index++ }
		})
		.toArray();

	return _mediaSaveService.updateMediaIndexByIdsAsync(mediaIdsReordered);
};

// END Remove medium

var PlaylistDirector = function(
	fileExplorerService,
	mediaDirector,
	physicalPlaylistServices,
	playlistSaveService,
	mediaSaveService,
	mediaService,
	mediaBuilder)
{
	_fileExplorerService = fileExplorerService;
	_mediaDirector = mediaDirector;
	_physicalPlaylistServices = physicalPlaylistServices;
	_playlistSaveService = playlistSaveService;
	_mediaSaveService = mediaSaveService;
	_mediaService = mediaService;
	_mediaBuilder = mediaBuilder;
};

PlaylistDirector.prototype = {
	feedPhysicalPlaylistWithMediaAndSaveAsync: feedPhysicalPlaylistWithMediaAndSaveAsync,
	updatePlaylistAsync: updatePlaylistAsync,
	getMediaFromPlaylistByIdAsync: getMediaFromPlaylistByIdAsync,
	addMediumByFilePathAsync: addMediumByFilePathAsync,
	insertMediumByFilePathAsync: insertMediumByFilePathAsync,
	removeMediaAsync: removeMediaAsync
};

module.exports = PlaylistDirector;