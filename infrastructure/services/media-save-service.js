var Q = require('q');
var from = require('fromjs');
var mongodb = require('mongodb');


var MediaSaveService = (function () {
	'use strict';

	function MediaSaveService(saveService, mediaService, mediaBuilder) {

		this.getMediasFromPlaylistIdAsync = function(playlistId) {
			return saveService
				.getPlaylistsRepositoryAsync()
				.then(assertOnPlaylistNotFound)
				.then(function (playlistSet) { 
					return findPlaylistById(playlistSet, playlistId)
						.then(selectMediasFromPlaylist);
				})
				.then(function (playlist) {
					mediaService.updateMustRelocalizeState()
				});

	// 			return saveService
	// .getPlaylistsRepositoryAsync()
	// .then(selectMediasFromPlaylist)
		};

		function selectMediasFromPlaylist(playlist) {
			return playlist.medias;
		}

		function assertOnPlaylistsNotFound(playlistIds) {
			if (!playlistIds || playlistIds.length == 0) {
				throw "No playlists have been found";
			}
			return playlistIds;
		}
	}

	return MediaSaveService;
})();

module.exports = MediaSaveService;