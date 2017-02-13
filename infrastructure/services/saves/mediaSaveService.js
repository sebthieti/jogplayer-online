'use strict';

var Q = require('q'),
	from = require('fromjs'),
	Models = require('../../models'),
	Media = Models.Media,
	Playlist = Models.Playlist;

var _saveService,
	_mediaService,
	_mediaBuilder;

function MediaSaveService(saveService, mediaService, mediaBuilder) {
	_saveService = saveService;
	_mediaService = mediaService;
	_mediaBuilder = mediaBuilder;
}

MediaSaveService.prototype.getMediaByIdAsync = function(mediaId) {
	var defer = Q.defer();

	Media.findOne({ _id: mediaId }, function(err, media) {
		if (!err) { defer.resolve(media) }
		else { defer.reject(err) }
	});

	return defer.promise;
};

MediaSaveService.prototype.findIndexFromMediaIdsAsync = function(mediaId) {
	var defer = Q.defer();

	Media
		.findOne({ _id: mediaId })
		.select('index')
		.exec(function(err, medium) {
			if (err) { defer.reject(err); }
			else { defer.resolve(medium.index); }
		});

	return defer.promise;
};

MediaSaveService.prototype.updateMustRelocalizeOnMedia = function (media) {
	// return saveService.getPlaylistsRepositoryAsync()
};

MediaSaveService.prototype.insertMediumAsync = function (medium) {
	var defer = Q.defer();

	medium.save(function(err, newMedia) {
		if (!err) { defer.resolve(newMedia) }
		else { defer.reject(err) }
	});

	return defer.promise;
};

MediaSaveService.prototype.updateMediaIndexByIdsAsync = function (mediaIdIndexesToOffset) {
	var updateMediaIdIndexPromises = mediaIdIndexesToOffset.map(function(value) {
		return this.updateMediaIndexByIdAsync(value._id, value.index);
	}, this);
	return Q.all(updateMediaIdIndexPromises);
};

MediaSaveService.prototype.updateMediaIndexByIdAsync = function (mediaId, newIndex) {
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
};

MediaSaveService.prototype.removeMediumAsync = function(medium) {
	var defer = Q.defer();

	medium.remove(function(err, medium) {
		if (!err) { defer.resolve(medium) }
		else { defer.reject(err) }
	});

	return defer.promise;
};

MediaSaveService.prototype.removeMediumByIdAsync = function(mediumId) {
	var defer = Q.defer();

	Media.findOneAndRemove({ _id: mediumId }, function(err, medium) {
		if (!err) { defer.resolve(medium) }
		else { defer.reject(err) }
	});

	return defer.promise;
};

module.exports = MediaSaveService;