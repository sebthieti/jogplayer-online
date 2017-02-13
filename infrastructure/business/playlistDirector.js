var fs = require('fs'),
	Q = require('q'),
	from = require('fromjs');

// TODO Should we use logic to select appropriate pl ? Probably to give a clean interface for both node modules
module.exports = (function () {
	'use strict';

	var _physicalPlaylistServices,
		_playlistSaveService,
		_mediaSaveService,
		_mediaService,
		_mediaBuilder;

	function PlaylistDirector (
		physicalPlaylistServices,
		playlistSaveService,
		mediaSaveService,
		mediaService,
		mediaBuilder)
	{
		_physicalPlaylistServices = physicalPlaylistServices;
		_playlistSaveService = playlistSaveService;
		_mediaSaveService = mediaSaveService;
		_mediaService = mediaService;
		_mediaBuilder = mediaBuilder;
	}

	PlaylistDirector.prototype.getMediasFromPlaylistByIdAsync = function (playlistId) {
		return _playlistSaveService
			.getPlaylistAsync(playlistId)
			.then(assertOnPlaylistNotFound)
			.then(function (unloadedPlaylist) {
				if (unloadedPlaylist.getIsVirtual()) {
					return _mediaSaveService
						.getMediasFromPlaylistIdAsync(unloadedPlaylist._id)
						.then(_mediaService.checkAndUpdateMustRelocalize)
						//.then(updateMustRelocalizeOnMedias) // TODO Do we need to schedule ?
						.then(function (medias) {
							return medias;
							//return Q.fcall(medias);
							//return unloadedPlaylist.setMedias(medias);
						});
				} else {
					return loadMediasToPlaylistAsync(unloadedPlaylist);
				}
			});
	};

	PlaylistDirector.prototype.addMediasAsync = function (medias, playlistId) {
		return _playlistSaveService
			.getMediaCountForPlaylistByIdAsync(playlistId)
			.then(function(count) { return performMediasInsertionAsync(medias, playlistId, count) })
			.then(insertMediasPromisesToMediaArray);
	};

	PlaylistDirector.prototype.insertMediasAsync = function (medias, playlistId, index) {
		if (index == null) { // We can just append
			return this.addMediasAsync(medias, playlistId);
		} else {
			return makeRoomForMediaAtIndexFromPlaylistIdAsync(index, playlistId)
				.then(function() { return performMediasInsertionAsync(medias, playlistId, index) })
				.then(insertMediasPromisesToMediaArray);
		}
	};

	var performMediasInsertionAsync = function (medias, desiredIndex) {
		var startIndex = desiredIndex;
		var insertMediasPromises = [];
		var mediaCount = medias.length;
		for (var mediaIndex = 0; mediaIndex < mediaCount; mediaIndex++, startIndex++) {
			var media = medias[mediaIndex];
			media.index = startIndex;

			insertMediasPromises[mediaIndex] = addMediaAsync(medias[mediaIndex]);/*, playlistId*/
		}
		return Q.all(insertMediasPromises);
	};

	var insertMediasPromisesToMediaArray = function (completedPromises) {
		var medias = new Array(completedPromises.length);
		completedPromises.forEach(function (completedPromise) {
			if (completedPromise.state === "fulfilled") {
				medias.push(result.value);
			} else {
				throw result.reason;
			}
		});
	};

	var addMediaAsync = function (media, playlistId) {
		return Q.fcall (function() { return true });
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

	var loadMediasToPlaylistAsync = function (playlist) {
		if (!playlist) {
			throw "PlaylistDirector.loadMediasToPlaylist: playlist must be set";
		}
		if (!playlist.filePath) {
			throw "PlaylistDirector.loadMediasToPlaylist: playlist.FilePath must be set";
		}

		var physicalPlaylistService = findPhysicalPlaylistServiceFor(playlist.filePath);
		if (!physicalPlaylistService) {
			throw "PlaylistDirector.loadMediasToPlaylist cannot load playlist of format: " + fs.extname(playlist.filePath);
		}

		return Q.promise(function(onSuccess, onError) {
			physicalPlaylistService
				.loadMediasFromPlaylistAsync(playlist.filePath)
				.then(toMediaArray)
				// TODO Also update path
				.then(_mediaService.checkAndUpdateMustRelocalize)
				.then(_mediaSaveService.updateMustRelocalizeOnMedias)
				.then(function (medias) {
					var loadedPlaylist = playlist.clone().setMedias(medias);
					onSuccess(loadedPlaylist);
				})
				.done();
		});
	};

	var assertOnPlaylistNotFound = function(playlist) {
		if (!playlist) {
			throw "No playlists have been found";
		}
		return playlist;
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

	return PlaylistDirector;
})();