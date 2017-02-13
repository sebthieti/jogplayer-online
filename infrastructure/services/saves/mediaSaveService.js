var Q = require('q'),
	from = require('fromjs'),
	mongodb = require('mongodb');

module.exports = (function () {
	'use strict';

	var _saveService,
		_mediaService,
		_mediaBuilder;

	function MediaSaveService(saveService, mediaService, mediaBuilder) {
		_saveService = saveService;
		_mediaService = mediaService;
		_mediaBuilder = mediaBuilder;
	}

	MediaSaveService.prototype.getMediasFromPlaylistIdAsync = function(playlistId) {
		return _saveService
			.getPlaylistsRepositoryAsync()
			.then(function (playlistSet) {
				return getMediaIdsFromPlaylistAsync(playlistSet, playlistId);
			})
			.then(function (mediaIds) {
				return this.getMediasByIdsAsync(mediaIds);
			}); // TODO updateMustRelocalizeState ?
	};

	MediaSaveService.prototype.getMediasByIdsAsync = function (mediaIds) {
		return _saveService
			.getMediasRepositoryAsync()
			.then(function(mediaSet) {
				var query = [];
				var mediaIdsLength = mediaIds.length;
				for (var paramIndex = 0; paramIndex < mediaIdsLength; paramIndex++) {
					query.push( {_id: mongodb.ObjectID(mediaIds[paramIndex]._id)} );
				}

				return Q.promise(function(onSucceed, onError) {
					mediaSet
						.find( { $or: query} )
						.sort( {index: 1} )
						.toArray(function (err, medias) {
							if (!err) {
								onSucceed(medias);
							} else {
								onError(err);
							}
						});
				});
			});
	};

	MediaSaveService.prototype.getMediaByIdAsync = function(mediaId) {
		return _saveService
			.getMediasRepositoryAsync()
			.then(function (mediaSet) {
				return findMediaByIdAsync(mediaSet, mediaId);
			});
	};

	MediaSaveService.prototype.updateMustRelocalizeOnMedias = function (medias) {
		// return saveService.getPlaylistsRepositoryAsync()
	};

	var findMediaByIdAsync = function (mediaSet, mediaId) {
		return Q.promise(function(onSucceed, onError) {
			mediaSet.findOne({ _id: mongodb.ObjectID(mediaId) }, function (err, media) {
				if(!err) {
					onSucceed(media);
				} else {
					onError(err);
				}
			});
		});
	};

	var getMediaIdsFromPlaylistAsync = function (playlistSet, playlistId) {
		return Q.promise(function(onSucceed, onError) {
			playlistSet
				.find({ _id: mongodb.ObjectID(playlistId) })
				.toArray(function (err, playlist) {
					if (!err) {
						onSucceed(playlist[0].medias);
					} else {
						onError(err);
					}
				});
		});
	};

	return MediaSaveService;
})();