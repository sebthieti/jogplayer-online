'use strict';

var fs = require('fs'),
	Q = require('q'),
	from = require('fromjs');

var _physicalPlaylistServices,
	_playlistSaveService,
	_mediaSaveService,
	_mediaService,
	_mediaBuilder,
	_mediaDirector;

function PlaylistDirector (
	mediaDirector,
	physicalPlaylistServices,
	playlistSaveService,
	mediaSaveService,
	mediaService,
	mediaBuilder)
{
	_mediaDirector = mediaDirector;
	_physicalPlaylistServices = physicalPlaylistServices;
	_playlistSaveService = playlistSaveService;
	_mediaSaveService = mediaSaveService;
	_mediaService = mediaService;
	_mediaBuilder = mediaBuilder;
}

PlaylistDirector.prototype.getMediaFromPlaylistByIdAsync = function (playlistId) {
	return _playlistSaveService
		.getPlaylistWithMediaAsync(playlistId)
		.then(assertOnNotFound)
		.then(function (playlist) {
			if (playlist.isVirtual) {
				return playlist.media;
			} else {
				/*
				 return _mediaSaveService
				 .getMediasFromPlaylistIdAsync(unloadedPlaylist._id)
				 .then(_mediaService.checkAndUpdateMustRelocalize)
				 //.then(updateMustRelocalizeOnMedias) // TODO Do we need to schedule ?
				 .then(function (medias) {
				 return medias;
				 //return Q.fcall(medias);
				 //return unloadedPlaylist.setMedias(medias);
				 });
				 */
				return loadMediaToPlaylistAsync(unloadedPlaylist);
			}
		});
};

PlaylistDirector.prototype.addMediaAsync = function (playlistId, media) {
	return _playlistSaveService
		.getMediaCountForPlaylistByIdAsync(playlistId)
		.then(function(count) { return performMediaInsertionAsync(playlistId, media, count) })
		.then(flattenMediaPromisesToMediaArray);
};

PlaylistDirector.prototype.addMediaByFilePathAsync = function (playlistId, mediaFilePaths) {
	return _playlistSaveService
		.getMediaCountForPlaylistByIdAsync(playlistId)
		.then(function(mediaCount) {
			return performMediaByFilePathCreationAsync(mediaFilePaths, mediaCount);
		})
		.then(flattenMediaPromisesToMediaArray)
		.then(function(mediaArray) {
			return _playlistSaveService.insertMediaToPlaylistAsync(playlistId, mediaArray);
		});
};

PlaylistDirector.prototype.insertMediaAsync = function (playlistId, media, index) {
	if (index == null) { // We can just append
		return this.addMediaAsync(media, playlistId);
	} else {
		return makeRoomForMediaAtIndexFromPlaylistIdAsync(index, playlistId)
			.then(function() { return performMediaInsertionAsync(media, playlistId, index) })
			.then(flattenMediaPromisesToMediaArray);
	}
};

PlaylistDirector.prototype.removeMediaAsync = function (playlistId, mediaId) {
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

var getMediaIdIndexToUpdateForReorderAsync = function (playlistId, mediaIndex) {
	var deferred = Q.defer();

	_playlistSaveService
		.getMediaIdsLowerThanAsync(playlistId, mediaIndex, false)
		.then(function(mediaIdsLower) {
			deferred.resolve( { lowerIds: mediaIdsLower, lowestIndex: mediaIndex });
		});

	return deferred.promise;
};

PlaylistDirector.prototype.insertMediaByFilePathAsync = function (playlistId, mediaFilePaths, index) {
	if (index == null) { // We can just append
		return this.addMediaAsync(media, playlistId);
	} else {
		return makeRoomForMediaAtIndexFromPlaylistIdAsync(index, playlistId)
			.then(function() { return performMediaByFilePathCreationAsync(playlistId, mediaFilePaths, index) })
			.then(flattenMediaPromisesToMediaArray);
	}
};

var performMediaInsertionAsync = function (playlistId, media, desiredIndex) {
	var startIndex = desiredIndex;
	var insertMediaPromises = [];
	var mediaCount = media.length;
	for (var mediaIndex = 0; mediaIndex < mediaCount; mediaIndex++, startIndex++) {
		var media = media[mediaIndex];
		media.index = startIndex;

		insertMediaPromises[mediaIndex] = addMediaAsync(media[mediaIndex]);/*, playlistId*/
	}
	return Q.all(insertMediaPromises);
};

var performMediaByFilePathCreationAsync = function (mediaFilePaths, desiredIndex) { // TODO Index is fixed
	var startIndex = desiredIndex;
	var insertMediaPromises = [];
	var mediaCount = mediaFilePaths.length;
	for (var mediaIndex = 0; mediaIndex < mediaCount; mediaIndex++, startIndex++) {
		var mediaFilePath = mediaFilePaths[mediaIndex];
		insertMediaPromises[mediaIndex] = _mediaBuilder
			.buildMediaAsync(mediaFilePath, startIndex)
			.then(function(medium) {
				return _mediaSaveService.insertMediumAsync(medium);
			});
	}
	return Q.all(insertMediaPromises);
};

var addMediaAsync = function (playlistId, media) {
	return Q.fcall (function() { return true });
};

var flattenMediaPromisesToMediaArray = function (completedPromises) {
	var media = new Array(completedPromises.length);
	completedPromises.forEach(function (completedPromise, index) {
		if (completedPromise/*.state === "fulfilled"*/) {
			media[index] = completedPromise/*result.value*/;
		} else {
			throw result.reason;
		}
	});
	return media;
};

var makeRoomForMediaAtIndexFromPlaylistIdAsync = function (desiredIndex, playlistId) {
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

var loadMediaToPlaylistAsync = function (playlist) {
	if (!playlist) {
		throw "PlaylistDirector.loadMediaToPlaylist: playlist must be set";
	}
	if (!playlist.filePath) {
		throw "PlaylistDirector.loadMediaToPlaylist: playlist.FilePath must be set";
	}

	var physicalPlaylistService = findPhysicalPlaylistServiceFor(playlist.filePath);
	if (!physicalPlaylistService) {
		throw "PlaylistDirector.loadMediaToPlaylist cannot load playlist of format: " + fs.extname(playlist.filePath);
	}

	return Q.promise(function(onSuccess, onError) {
		physicalPlaylistService
			.loadMediaFromPlaylistAsync(playlist.filePath)
			.then(toMediaArray)
			// TODO Also update path
			.then(_mediaService.checkAndUpdateMustRelocalize)
			.then(_mediaSaveService.updateMustRelocalizeOnMedia)
			.then(function (media) {
				var loadedPlaylist = playlist.clone().setMedia(media);
				onSuccess(loadedPlaylist);
			})
			.done();
	});
};

var assertOnNotFound = function(data) {
	if (data === undefined || data === null) { throw "No data has been found" }
	return data;
};

var toMediaArray = function(mediaSummaries) {
	return from(mediaSummaries)
		.select(function (ms) { return _mediaBuilder.toMedia(ms) })
		.toArray();
};

var findPhysicalPlaylistServiceFor = function(plFilePath) {
	return from(_physicalPlaylistServices)
		.first(function (svc) { return svc.isOfType(plFilePath) });
};

module.exports = PlaylistDirector;