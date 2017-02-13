'use strict';

var fs = require('fs'),
	Q = require('q'),
	from = require('fromjs');

var _fileExplorerService,
	_physicalPlaylistServices,
	_playlistSaveService,
	_mediaSaveService,
	_mediaService,
	_mediaBuilder,
	_mediaDirector;

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

//PlaylistDirector.prototype.insertMediaAsync = function (playlistId, medium, index) {
//	return _mediaSaveService.insertMediumAsync(medium, index); // TODO Refactor
//}

var performMediaInsertionAsync = function (playlistId, media, desiredIndex) {
	var startIndex = desiredIndex;
	var mediaAddPromises = media.map(function(medium) {
		medium.filePath = medium.filePath.substring(1); // TODO Use PhysicalService for that ?
		medium.index = startIndex++;
		return _mediaSaveService.insertMediumAsync(medium);
	});

	return Q.all(mediaAddPromises);
};

var performMediaByFilePathInsertionAsync = function (playlistId, mediaFilePaths, desiredIndex) { // TODO Index is fixed
	var startIndex = desiredIndex;
	var mediaAddPromises = mediaFilePaths.map(function(mediaFilePath) {
		mediaFilePath = mediaFilePath.substring(1); // TODO Use PhysicalService for that ?
		return _mediaBuilder
			.buildMediaAsync(playlistId, mediaFilePath, startIndex)
			.then(function(medium) {
				medium.index = startIndex++;
				return _mediaSaveService.insertMediumAsync(medium);
			});
	});
	return Q.all(mediaAddPromises);
};

//var addMediaAsync = function (playlistId, media) {
//	return Q.fcall (function() { return true });
//};

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

var getMediaFromPlaylist = function (playlist) {
	if (!playlist) {
		throw "PlaylistDirector.loadMediaToPlaylist: playlist must be set";
	}
	if (!playlist.filePath) {
		throw "PlaylistDirector.loadMediaToPlaylist: playlist.FilePath must be set";
	}

	// TODO Following statement: should be elsewhere
	playlist.filePath = _fileExplorerService.normalizePathForCurrentOs(playlist.filePath);

	var physicalPlaylistService = findPhysicalPlaylistServiceFor(playlist.filePath);
	if (!physicalPlaylistService) {
		throw "PlaylistDirector.loadMediaToPlaylist cannot load playlist of format: " + fs.extname(playlist.filePath);
	}

	return physicalPlaylistService
		.loadMediaFromPlaylistAsync(playlist.filePath)
		.then(toMediaArrayAsync)
		// TODO Also update path
		.then(_mediaService.checkAndUpdateMustRelocalizeAsync)
		.then(_mediaSaveService.updateMustRelocalizeOnMedia)
		//.then(function (media) {
		//	//var loadedPlaylist = playlist.clone().setMedia(media); TODO Maybe use Playlist and add clone, setMedia
		//	//return loadedPlaylist;//onSuccess(loadedPlaylist);
		//	playlist.media = media;
		//	return playlist;
		//})
		//.done()
		;
};

var loadMediaToPlaylistAsync = function (playlist) {
	if (!playlist) {
		throw "PlaylistDirector.loadMediaToPlaylist: playlist must be set";
	}
	if (!playlist.filePath) {
		throw "PlaylistDirector.loadMediaToPlaylist: playlist.FilePath must be set";
	}

	// TODO Following statement: should be elsewhere
	playlist.filePath = _fileExplorerService.normalizePathForCurrentOs(playlist.filePath);

	var physicalPlaylistService = findPhysicalPlaylistServiceFor(playlist.filePath);
	if (!physicalPlaylistService) {
		throw "PlaylistDirector.loadMediaToPlaylist cannot load playlist of format: " + fs.extname(playlist.filePath);
	}

	//Q.promise(function(onSuccess, onError) {
	return physicalPlaylistService
			.loadMediaFromPlaylistAsync(playlist.filePath)
			.then(toMediaArrayAsync)
			// TODO Also update path
			.then(_mediaService.checkAndUpdateMustRelocalizeAsync)
			.then(_mediaSaveService.updateMustRelocalizeOnMedia)
			.then(function (media) {
				//var loadedPlaylist = playlist.clone().setMedia(media); TODO Maybe use Playlist and add clone, setMedia
				//return loadedPlaylist;//onSuccess(loadedPlaylist);
				playlist.media = media;
				return playlist;
			})
			//.done()
		;
	//});
};

var assertOnNotFound = function(data) {
	if (data === undefined || data === null) { throw "No data has been found" }
	return data;
};

var toMediaArrayAsync = function(mediaSummaries) {
	var arr = from(mediaSummaries)
		.select(function (ms) { return _mediaBuilder.toMediaAsync(ms) })
		.toArray();
	return Q.all(arr);
};

var findPhysicalPlaylistServiceFor = function(plFilePath) {
	return from(_physicalPlaylistServices)
		.first(function (svc) { return svc.isOfType(plFilePath) });
};

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

	getMediaFromPlaylistByIdAsync: function (playlistId) {
		return _playlistSaveService
			.getPlaylistWithMediaAsync(playlistId)
			.then(assertOnNotFound)
			.then(function (playlist) {
				if (playlist.isVirtual) {
					return playlist.media;
				} else {
					return _mediaService
						.checkAndUpdateMustRelocalizeAsync(playlist.media); // TODO Do we need to schedule ?
				}
			});
	},

	addMediaAsync: function (playlistId, media) {
		return _playlistSaveService
			.getMediaCountForPlaylistByIdAsync(playlistId)
			.then(function(count) { return performMediaInsertionAsync(playlistId, media, count) })
			.then(function(mediaArray) {
				return _playlistSaveService.insertMediaToPlaylistAsync(playlistId, mediaArray);
			});
	},

	addMediaByFilePathAsync: function (playlistId, mediaFilePaths) {
		return _playlistSaveService
			.getMediaCountForPlaylistByIdAsync(playlistId)
			.then(function(mediaCount) {
				return performMediaByFilePathInsertionAsync(playlistId, mediaFilePaths, mediaCount);
			})
			.then(function(mediaArray) {
				return _playlistSaveService.insertMediaToPlaylistAsync(playlistId, mediaArray);
			});
	},

	loadMediaToPlaylistAsync: loadMediaToPlaylistAsync,

	getMediaFromPlaylist: getMediaFromPlaylist,

	insertMediaAsync: function (playlistId, media, index) {
		if (index == null) { // We can just append
			return this.addMediaAsync(media, playlistId);
		} else {
			return makeRoomForMediaAtIndexFromPlaylistIdAsync(index, playlistId)
				.then(function() { return performMediaInsertionAsync(media, playlistId, index) });
		}
	},

	insertMediaByFilePathAsync: function (playlistId, mediaFilePaths, index) {
		if (index == null) { // We can just append
			return this.addMediaAsync(media, playlistId);
		} else {
			return makeRoomForMediaAtIndexFromPlaylistIdAsync(index, playlistId)
				.then(function() { return performMediaByFilePathInsertionAsync(playlistId, mediaFilePaths, index) });
		}
	},

	removeMediaAsync: function (playlistId, mediaId) {
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
	}

};

module.exports = PlaylistDirector;