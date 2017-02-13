var fs = require('fs');
var Q = require('q');
var from = require('fromjs');

// TODO Should we use logic to select appropriate pl ? Probably to give a clean interface for both node modules
var PlaylistDirector = (function () {
	'use strict';

	function PlaylistDirector (physicalPlaylistServices, playlistSaveService, mediaSaveService, mediaService, mediaBuilder) {

		this.getMediasFromPlaylistByIdAsync = function (playlistId) {
			return playlistSaveService
				.getPlaylistAsync(playlistId)
				.then(assertOnPlaylistNotFound)
				.then(function (unloadedPlaylist) {
					if (unloadedPlaylist.getIsVirtual()) {
						return mediaSaveService
							.getMediasFromPlaylistIdAsync(unloadedPlaylist._id)
							.then(mediaService.checkAndUpdateMustRelocalize)
							.then(updateMustRelocalizeOnMedias) // TODO Do we need to schedule ?
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

		this.addMediasAsync = function (medias, playlistId) {
			return playlistSaveService
				.getMediaCountForPlaylistByIdAsync()
				.then(function(count) { return performMediasInsertionAsync(medias, playlistId, count) })
				.then(insertMediasPromisesToMediaArray);
		};

		this.insertMediasAsync = function (medias, playlistId, index) {
			return makeRoomForMediaAtIndexFromPlaylistIdAsync(index, playlistId)
				.then(function() { return performMediasInsertionAsync(medias, playlistId, index) })
				.then(insertMediasPromisesToMediaArray);
		};

		function performMediasInsertionAsync (medias, desiredIndex) {
			var startIndex = desiredIndex;
			var insertMediasPromises = [];
			var mediaCount = medias.length;
			for (var mediaIndex = 0; mediaIndex < mediaCount; mediaIndex++, startIndex++) {
				var media = medias[mediaIndex];
				media.index = startIndex;

				insertMediasPromises[mediaIndex] = addMediaAsync(medias[mediaIndex], playlistId);
			}
			return Q.all(insertMediasPromises);
		}

		function insertMediasPromisesToMediaArray (completedPromises) {
			var medias = new Array(completedPromises.length);
			completedPromises.forEach(function (completedPromise) {
				if (completedPromise.state === "fulfilled") {
					medias.push(result.value);
				} else {
					throw result.reason;
				}
			});
		}

		function addMediaAsync (media, playlistId) {
			return Q.fcall (function() { return true });
		}

		function makeRoomForMediaAtIndexFromPlaylistIdAsync (desiredIndex, playlistId) {
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

		function loadMediasToPlaylistAsync (playlist) {
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
					.then(mediaService.checkAndUpdateMustRelocalize)
					.then(mediaSaveService.updateMustRelocalizeOnMedias)
					.then(function (medias) {
						var loadedPlaylist = playlist.clone().setMedias(medias);
						onSuccess(loadedPlaylist);
					})
					.done();
			});
		};

		function assertOnPlaylistNotFound(playlist) {
			if (!playlist) {
				throw "No playlists have been found";
			}
			return playlist;
		}

		function toMediaArray(mediaSummaries) {
			return from(mediaSummaries)
				.select(function (ms) { return mediaBuilder.toMedia(ms) })
				.toArray();
		}

		function findPhysicalPlaylistServiceFor(plFilePath) {
			return from(physicalPlaylistServices)
				.first(function (svc) { return svc.isOfType(plFilePath) });
		}
	}

	return PlaylistDirector;
})();

module.exports = PlaylistDirector;