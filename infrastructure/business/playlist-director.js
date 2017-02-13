var Q = require('q');
var from = require('fromjs');

// TODO Should we use logic to select appropriate pl ? Probably to give a clean interface for both node modules
var PlaylistDirector = (function () {
	'use strict'

	function PlaylistDirector (physicalPlaylistServices, playlistSaveService, mediaSaveService, mediaService, mediaBuilder) {

		this.getPlaylistContentAsync = function (playlistId) {
			// In case of phys:
			// load media with db (check for file still exists)

			// In case of phys:
			// load medias from phys pl (check for file still exists).
			// sync with db

			return playlistSaveService
				.getPlaylistAsync(playlistId)
				.then(assertOnPlaylistNotFound)
				.then(function (unloadedPlaylist) {
					if (unloadedPlaylist.getIsVirtual()) {
						return mediaSaveService
							.getMediasFromPlaylistIdAsync(unloadedPlaylist._id)
							.then(mediaService.checkAndUpdateMustRelocalize)
							.then(function (medias) {
//								unloadedPlaylist.medias = medias;
//								return unloadedPlaylist;
								return unloadedPlaylist.setMedias(medias);
							});
					} else {
						return loadMediasToPlaylistAsync(unloadedPlaylist);
					}
				});
		};

		this.addMediaAsync = function (playlistId, filePaths) {
		};

		this.insertMediaAsync = function (playlistId, filePaths, index) {
		};

		function assertOnPlaylistsNotFound(playlistIds) {
			if (!playlistIds || playlistIds.length == 0) {
				throw "No playlists have been found";
			}
			return playlistIds;
		}

		function assertOnPlaylistNotFound(playlist) {
			if (!playlist) {
				throw "No playlists have been found";
			}
			return playlist;
		}

		function loadMediasToPlaylistAsync (playlist) {
			if (!playlist) {
				throw "PlaylistDirector.loadMediasToPlaylist: playlist must be set";
			}
			if (!playlist.filePath) {
				throw "PlaylistDirector.loadMediasToPlaylist: playlist.FilePath must be set";
			}

			var physicalPlaylistService = findPhysicalPlaylistServiceFor(playlist.filePath);

			return Q.promise(function(onSuccess, onError) {
				physicalPlaylistService
					.loadMediasFromPlaylistAsync(playlist.filePath)
					.then(toMediaArray)
					.then(function (medias) {
						var loadedPlaylist = playlist
							.clone()
							.setMedias(medias);
						onSuccess(loadedPlaylist);
					})
					.done();
			});
		};

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