'use strict';

var fs = require('fs'),
	Q = require('q'),
	from = require('fromjs'),
	_ = require('underscore'),
	utils = require('../utils');

var _fileExplorerService,
	_physicalPlaylistServices,
	_playlistSaveService,
	_playlistProxy,
	_playlistsProxy,
	_mediaSaveService,
	_mediaService,
	_mediaBuilder,
	_mediaDirector;

var PlaylistDirector = function(
	fileExplorerService,
	mediaDirector,
	physicalPlaylistServices,
	playlistSaveService,
	playlistProxy,
	playlistsProxy,
	mediaSaveService,
	mediaService,
	mediaBuilder)
{
	_fileExplorerService = fileExplorerService;
	_mediaDirector = mediaDirector;
	_physicalPlaylistServices = physicalPlaylistServices;
	_playlistSaveService = playlistSaveService;
	_playlistProxy = playlistProxy;
	_playlistsProxy = playlistsProxy;
	_mediaSaveService = mediaSaveService;
	_mediaService = mediaService;
	_mediaBuilder = mediaBuilder;
};

PlaylistDirector.prototype.updatePlaylistAsync = function(playlistId, playlistDto, issuer) {
	return _playlistProxy
		.getMediaCountForPlaylistByIdAsync(playlistId, issuer)
		.then(function() {
			return _playlistProxy.updatePlaylistDtoAsync(
				playlistId,
				playlistDto,
				issuer
			);
		}/*, function(err) { // In case playlist doesn't exists anymore

		}*/);
};

PlaylistDirector.prototype.getMediaFromPlaylistByIdAsync = function (playlistId, issuer) {
	return _playlistProxy
		.getPlaylistWithMediaAsync(playlistId, issuer)
		.then(assertOnNotFound)
		.then(function (playlist) {
			if (playlist.isVirtual) {
				// A virtual playlist won't change outside (compared to physical)
				return { playlist: playlist, reloaded: false };
			} else {
				return ifPhysicalPlaylistChangeThenUpdateAsync(playlist, issuer);
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

function ifPhysicalPlaylistChangeThenUpdateAsync(playlist, issuer) {
	return Q
		.nfcall(fs.stat, playlist.filePath)
		.then(function(stat) {
			var lastUpdateOn = stat.mtime;
			if (playlistHasChanged(playlist.updatedOn, lastUpdateOn)) {
				return updatePlaylistDateReloadMediaAndSaveAsync(playlist, lastUpdateOn, issuer)
					.then(function(pl) {
						return { playlist: pl, reloaded: true }
					});
			}
			return { playlist: playlist, reloaded: false };
		});
}

function updatePlaylistDateReloadMediaAndSaveAsync(playlist, lastUpdateOn, issuer) {
	return _playlistProxy//_playlistSaveService
		.removeAllMediaFromPlaylistAsync(playlist.id, issuer)
		.then(function(cleanPl) {
			return cleanPl.setUpdatedOn(lastUpdateOn);
		})
		.then(function(cleanPlUpdated) {
			return utils.saveModelAsync(cleanPlUpdated);
		})
		.then(function(savedPlaylist) {
			return innerFeedPhysicalPlaylistWithMediaAndSaveAsync(savedPlaylist, issuer);
		});
}

function playlistHasChanged(currentPlaylistUpdateDate, lastUpdateDate) {
	return lastUpdateDate > currentPlaylistUpdateDate;
}

PlaylistDirector.prototype.addMediumByFilePathAsync = function (playlistId, mediaFilePaths, issuer) {
	return this.insertMediumByFilePathAsync(playlistId, mediaFilePaths, null, issuer);
};

PlaylistDirector.prototype.insertMediumByFilePathAsync = function (playlistId, mediaFilePath, index, issuer) {
	var prepareAndGetPosition;
	if (index === undefined || index === null) { // We'll append medium
		prepareAndGetPosition = _playlistProxy.getMediaCountForPlaylistByIdAsync(playlistId, issuer);
	} else {
		prepareAndGetPosition = makeRoomForMediaAtIndexFromPlaylistIdAsync(playlistId, index, issuer)
			.then(function() { return index });
	}

	return prepareAndGetPosition
		.then(function(mediaPosition) {
			return buildAndInsertMediumByFilePathAsync(playlistId, mediaFilePath, mediaPosition, issuer);
		})
		.then(function(unlinkedMedium) {
			return _playlistProxy.insertMediumToPlaylistAsync(playlistId, unlinkedMedium, issuer);
		})
		.then(function(linkedMedium) {
			return _playlistProxy
				.getPlaylistWithMediaAsync(playlistId, issuer)
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

function buildAndInsertMediumByFilePathAsync(playlistId, mediaFilePath, desiredIndex, issuer) {
	mediaFilePath = _fileExplorerService.normalizePathForCurrentOs(mediaFilePath);
	return _mediaBuilder
		.buildMediumAsync(playlistId, mediaFilePath, desiredIndex, issuer)
		.then(utils.saveModelAsync);
}

function makeRoomForMediaAtIndexFromPlaylistIdAsync(playlistId, desiredIndex, issuer) { // TODO Why playlistId is demanded ?
	return _playlistsProxy
		.getPlaylistsCountAsync(issuer)
		.then(function(count) {
			if (desiredIndex == null || desiredIndex > count) {
				desiredIndex = count;
			} else if (desiredIndex < 0) {
				throw new Error('The given index is out of bounds'); // TODO To clean exceptions
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
						return _playlistProxy.updatePlaylistIdsPositionAsync(plIdIndexesToOffset, issuer)
					});
			}
		});
}

PlaylistDirector.prototype.removeMediaAsync = function (playlistId, mediaId, issuer) {
	return _mediaSaveService
		.findIndexFromMediaIdsAsync(mediaId, issuer)
		.then(assertOnNotFound)
		.then(function(mediaIndex) {
			return getMediaIdIndexToUpdateForReorderAsync(playlistId, mediaIndex, issuer);
		})
		.then(function(plIdLowIdSet) {
			if (plIdLowIdSet.lowerIds.length > 0) {
				return reorderLowerMedia(plIdLowIdSet, mediaId, issuer);
			}
		})
		.then(function () {
			return _playlistProxy.removeMediaFromPlaylistAsync(playlistId, mediaId, issuer);
		});
};

function getMediaIdIndexToUpdateForReorderAsync(playlistId, mediaIndex, issuer) {
	return _playlistProxy
		.getMediaIdsLowerThanAsync(playlistId, mediaIndex, false, issuer)
		.then(function(mediaIdsLower) {
			return { lowerIds: mediaIdsLower, lowestIndex: mediaIndex };
		});
}

function reorderLowerMedia(mediaIdsLowerSet, mediaIdToRemove, issuer) {
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

	return _mediaSaveService.updateMediaIndexByIdsAsync(mediaIdsReordered, issuer);
}

PlaylistDirector.prototype.feedPhysicalPlaylistWithMediaAndSaveAsync = function(emptyPlaylist, issuer) {
	return innerFeedPhysicalPlaylistWithMediaAndSaveAsync(emptyPlaylist, issuer);
};

function innerFeedPhysicalPlaylistWithMediaAndSaveAsync(emptyPlaylist, issuer) {
	return loadMediaFromPhysicalPlaylistAsync(emptyPlaylist, issuer) // Should give new Pl with media not yet persisted
		.then(saveMediaAsync)
		.then(function(media) {
			return _playlistProxy.insertMediaToPlaylistReturnSelfAsync(
				emptyPlaylist.id,
				media,
				issuer
			);
		});
}

function loadMediaFromPhysicalPlaylistAsync(emptyPlaylist, issuer) {
	if (!emptyPlaylist) {
		throw new Error('PlaylistDirector.injectMediaToPhysicalPlaylistAsync: playlist must be set');
	}

	var filePath = emptyPlaylist.filePath;
	if (!filePath) {
		throw new Error('PlaylistDirector.injectMediaToPhysicalPlaylistAsync: playlist.FilePath must be set');
	}

	var physicalPlaylistService = findPhysicalPlaylistServiceFor(filePath);
	if (!physicalPlaylistService) {
		throw new Error('PlaylistDirector.injectMediaToPhysicalPlaylistAsync cannot load playlist of format: ' + fs.extname(filePath));
	}

	var plId = emptyPlaylist.id;
	return physicalPlaylistService
		.loadMediaSummariesFromPlaylistAsync(filePath)
		.then(function(ms) { return _mediaBuilder.toMediaAsync(ms, plId, issuer) });
}

function findPhysicalPlaylistServiceFor(plFilePath) {
	return from(_physicalPlaylistServices)
		.first(function (svc) { return svc.isOfType(plFilePath) });
}

function assertOnNotFound(data) {
	if (data === undefined || data === null) { throw new Error('No data has been found') }
	return data;
}

module.exports = PlaylistDirector;
