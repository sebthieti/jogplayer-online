var Q = require('q');
var from = require('fromjs');
var mongodb = require('mongodb');


var MediaSaveService = (function () {
	'use strict';

	function MediaSaveService(saveService, mediaService, mediaBuilder) {

		this.getMediasFromPlaylistIdAsync = function(playlistId) {
			return saveService
				.getPlaylistsRepositoryAsync()
				//.then(assertOnPlaylistNotFound)
				.then(function (playlistSet) { return findMediasFromPlaylist(playlistSet, playlistId) })
				//.then(function (playlist) { return mediaService.updateMustRelocalizeState() });
	// function (playlistSet) { 
	// return findPlaylistById(playlistSet, playlistId)
	// 	.then(selectMediasFromPlaylist);
	// }

	// 			return saveService
	// .getPlaylistsRepositoryAsync()
	// .then(selectMediasFromPlaylist)
		};

		this.updateMustRelocalizeOnMedias = function (medias) {
			// return saveService
			// 	.getPlaylistsRepositoryAsync()
		};

		function findMediasFromPlaylist(playlistSet, playlistId) {
			return playlistSet.find(
				{ _id: mongodb.ObjectID(playlistId) },
				{ medias: 1 }
			)
			.sort( {index: 1} );
		}

		// function assertOnPlaylistsNotFound(playlistIds) {
		// 	if (!playlistIds || playlistIds.length == 0) {
		// 		throw "No playlists have been found";
		// 	}
		// 	return playlistIds;
		// }
	}

	return MediaSaveService;
})();

module.exports = MediaSaveService;