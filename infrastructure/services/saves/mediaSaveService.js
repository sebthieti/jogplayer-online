'use strict';

var Q = require('q'),
	from = require('fromjs');

var _saveService,
	_mediaBuilder,
	Media,
	Playlist;

var MediaSaveService = function (saveService, mediaBuilder, mediaModel, playlistModel) {
	_saveService = saveService;
	_mediaBuilder = mediaBuilder;
	Media = mediaModel;
	Playlist = playlistModel;
}

MediaSaveService.prototype = {

	getMediaByIdAsync: function(mediaId) {
		var defer = Q.defer();

		Media.findOne({ _id: mediaId }, function(err, media) {
			if (!err) { defer.resolve(media) }
			else { defer.reject(err) }
		});

		return defer.promise;
	},

	findIndexFromMediaIdsAsync: function(mediaId) {
		var defer = Q.defer();

		Media
			.findOne({ _id: mediaId })
			.select('index')
			.exec(function(err, medium) {
				if (err) { defer.reject(err); }
				else { defer.resolve(medium.index); }
			});

		return defer.promise;
	},

	updateMustRelocalizeOnMedia: function (media) {
		// return saveService.getPlaylistsRepositoryAsync()
		return media;
	},

	insertMediumAsync: function (medium) {
		var defer = Q.defer();

		medium.save(function(err, newMedia) {
			if (!err) { defer.resolve(newMedia) }
			else { defer.reject(err) }
		});

		return defer.promise;
	},

	updateMediaIndexByIdsAsync: function (mediaIdIndexesToOffset) {
		var updateMediaIdIndexPromises = mediaIdIndexesToOffset.map(function(value) {
			return this.updateMediaIndexByIdAsync(value._id, value.index);
		}, this);
		return Q.all(updateMediaIdIndexPromises);
	},

	updateMediaIndexByIdAsync: function (mediaId, newIndex) {
		var defer = Q.defer();

		Media
			.findOne({ _id: mediaId })
			.select('index')
			.exec(function(readError, medium) {
				if (readError) {
					defer.reject(readError);
				} else {
					medium.index = newIndex;
					medium.save(function(writeError, updatedMedium) {
						if (writeError) { defer.reject(writeError) }
						else { defer.resolve(updatedMedium) }
					});
				}
			});

		return defer.promise;
	},

	removeMediumAsync: function(medium) {
		var defer = Q.defer();

		medium.remove(function(err, medium) {
			if (!err) { defer.resolve(medium) }
			else { defer.reject(err) }
		});

		return defer.promise;
	},

	removeMediumByIdAsync: function(mediumId) {
		var defer = Q.defer();

		Media.findOneAndRemove({ _id: mediumId }, function(err, medium) {
			if (!err) { defer.resolve(medium) }
			else { defer.reject(err) }
		});

		return defer.promise;
	}

};
module.exports = MediaSaveService;