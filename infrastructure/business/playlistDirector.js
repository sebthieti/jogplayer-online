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

PlaylistDirector.prototype.updatePlaylistAsync = function(playlistId, playlistDto, owner) {
	return _playlistSaveService.updatePlaylistDtoAsync(playlistId, playlistDto, owner);
};

PlaylistDirector.prototype.getMediaFromPlaylistByIdAsync = function (playlistId, owner) {
	return _playlistSaveService
		.getPlaylistWithMediaAsync(playlistId, owner)
		.then(assertOnNotFound)
		.then(function (playlist) {
			if (playlist.isVirtual) {
				// A virtual playlist won't change outside (compared to physical)
				return { playlist: playlist, reloaded: false };
			} else {
				return ifPhysicalPlaylistChangeThenUpdateAsync(playlist, owner);
			}
		})
		.then(ifPlaylistNotReloadedCheckMediaAvailabilityAsync)
		.then(function(pl) {
			return pl.media;
		});
};

function ifPlaylistNotReloadedCheckMediaAvailabilityAsync(plReloadedSet) {

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
}

function ifPhysicalPlaylistChangeThenUpdateAsync(playlist, owner) {
	return Q
		.nfcall(fs.stat, playlist.filePath)
		.then(function(stat) {
			var lastUpdateOn = stat.mtime;
			if (playlistHasChanged(playlist.updatedOn, lastUpdateOn)) {
				return updatePlaylistDateReloadMediaAndSaveAsync(playlist, lastUpdateOn, owner)
					.then(function(pl) {
						return { playlist: pl, reloaded: true }
					});
			}
			return { playlist: playlist, reloaded: false };
		});
}

function updatePlaylistDateReloadMediaAndSaveAsync(playlist, lastUpdateOn, owner) {
	return _playlistSaveService
		.removeAllMediaFromPlaylistAsync(playlist.id, owner)
		.then(function(cleanPl) {
			return cleanPl.setUpdatedOn(lastUpdateOn);
		})
		.then(function(cleanPlUpdated) {
			return utils.saveModelAsync(cleanPlUpdated);
		})
		.then(innerFeedPhysicalPlaylistWithMediaAndSaveAsync);
}

function playlistHasChanged(currentPlaylistUpdateDate, lastUpdateDate) {
	return lastUpdateDate > currentPlaylistUpdateDate;
}

PlaylistDirector.prototype.addMediumByFilePathAsync = function (playlistId, mediaFilePaths, owner) {
	return this.insertMediumByFilePathAsync(playlistId, mediaFilePaths, null, owner);
};

PlaylistDirector.prototype.insertMediumByFilePathAsync = function (playlistId, mediaFilePath, index, owner) {
	var prepareAndGetPosition;
	if (!index) { // We'll append medium
		prepareAndGetPosition = _playlistSaveService.getMediaCountForPlaylistByIdAsync(playlistId, owner);
	} else {
		prepareAndGetPosition = makeRoomForMediaAtIndexFromPlaylistIdAsync(playlistId, index, owner)
			.then(function() { return index });
	}

	return prepareAndGetPosition
		.then(function(mediaPosition) {
			return buildAndInsertMediumByFilePathAsync(playlistId, mediaFilePath, mediaPosition, owner);
		})
		.then(function(unlinkedMedium) {
			return _playlistSaveService.insertMediaToPlaylistAsync(playlistId, unlinkedMedium, owner);
		})
		.then(function(linkedMedium) {
			return _playlistSaveService
				.getPlaylistWithMediaAsync(playlistId, owner)
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

function saveMediaAsync(media) {
	var addMediaPromises = media.map(function(medium) {
		return utils.saveModelAsync(medium);
	});
	return Q.all(addMediaPromises);
}

function buildAndInsertMediumByFilePathAsync(playlistId, mediaFilePath, desiredIndex, owner) {
	mediaFilePath = _fileExplorerService.normalizePathForCurrentOs(mediaFilePath);
	return _mediaBuilder
		.buildMediumAsync(playlistId, mediaFilePath, desiredIndex, owner)
		.then(utils.saveModelAsync);
}

function makeRoomForMediaAtIndexFromPlaylistIdAsync(playlistId, desiredIndex, owner) { // TODO Why playlistId is demanded ?
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
}

PlaylistDirector.prototype.removeMediaAsync = function (playlistId, mediaId, owner) {
	return _mediaSaveService
		.findIndexFromMediaIdsAsync(mediaId, owner)
		.then(assertOnNotFound)
		.then(function(mediaIndex) {
			return getMediaIdIndexToUpdateForReorderAsync(playlistId, mediaIndex, owner);
		})
		.then(function(plIdLowIdSet) {
			if (plIdLowIdSet.lowerIds.length > 0) {
				return reorderLowerMedia(plIdLowIdSet, mediaId, owner);
			}
		})
		.then(function () {
			return _playlistSaveService.removeMediaFromPlaylistAsync(playlistId, mediaId, owner);
		});
};

function getMediaIdIndexToUpdateForReorderAsync(playlistId, mediaIndex, owner) {
	return _playlistSaveService
		.getMediaIdsLowerThanAsync(playlistId, mediaIndex, false, owner)
		.then(function(mediaIdsLower) {
			return { lowerIds: mediaIdsLower, lowestIndex: mediaIndex };
		});
}

function reorderLowerMedia(mediaIdsLowerSet, mediaIdToRemove, owner) {
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

	return _mediaSaveService.updateMediaIndexByIdsAsync(mediaIdsReordered, owner);
}

PlaylistDirector.prototype.feedPhysicalPlaylistWithMediaAndSaveAsync = function(emptyPlaylist, owner) {
	return innerFeedPhysicalPlaylistWithMediaAndSaveAsync(emptyPlaylist, owner);
};

function innerFeedPhysicalPlaylistWithMediaAndSaveAsync(emptyPlaylist, owner) {
	return loadMediaFromPhysicalPlaylistAsync(emptyPlaylist, owner) // Should give new Pl with media not yet persisted
		.then(saveMediaAsync)
		.then(function(media) {
			return _playlistSaveService.insertMediaToPlaylistReturnSelfAsync(
				emptyPlaylist.id,
				media,
				owner
			);
		});
}

function loadMediaFromPhysicalPlaylistAsync(emptyPlaylist, owner) {
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
		.then(function(ms) { return _mediaBuilder.toMediaAsync(ms, plId, owner) });
}

function findPhysicalPlaylistServiceFor(plFilePath) {
	return from(_physicalPlaylistServices)
		.first(function (svc) { return svc.isOfType(plFilePath) });
}

function assertOnNotFound(data) {
	if (data === undefined || data === null) { throw "No data has been found" }
	return data;
}

module.exports = PlaylistDirector;