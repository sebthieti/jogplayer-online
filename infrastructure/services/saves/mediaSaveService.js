'use strict';

var Q = require('q'),
	from = require('fromjs');

var _saveService,
	_mediaBuilder,
	Media,
	Playlist;

function MediaSaveService(saveService, mediaBuilder, mediaModel, playlistModel) {
	_saveService = saveService;
	_mediaBuilder = mediaBuilder;
	Media = mediaModel;
	Playlist = playlistModel;
}

MediaSaveService.prototype.getMediaByIdAsync = function(mediaId, owner) {
	var defer = Q.defer();

	Media.findOne({ _id: mediaId, ownerId: owner.id }, function(err, media) {
		if (!err) { defer.resolve(media) }
		else { defer.reject(err) }
	});

	return defer.promise;
};

MediaSaveService.prototype.getMediumByIdAndPlaylistIdAsync = function(playlistId, mediumId, owner) {
	var defer = Q.defer();

	Media.findOne({
		_id: mediumId,
		_playlistId: playlistId,
		ownerId: owner.id
	}, function(err, media) {
		if (!err) { defer.resolve(media) }
		else { defer.reject(err) }
	});

	return defer.promise;
};

MediaSaveService.prototype.findIndexFromMediaIdsAsync = function(mediaId, owner) {
	var defer = Q.defer();

	Media
		.findOne({ _id: mediaId, ownerId: owner.id })
		.select('index')
		.exec(function(err, medium) {
			if (err) { defer.reject(err) }
			else { defer.resolve(medium.index) }
		});

	return defer.promise;
};

MediaSaveService.prototype.updateMediaIndexByIdsAsync = function (mediaIdIndexesToOffset, owner) {
	var updateMediaIdIndexPromises = mediaIdIndexesToOffset.map(function(value) {
		return this.updateMediaIndexByIdAsync(value._id, value.index, owner);
	}, this);
	return Q.all(updateMediaIdIndexPromises);
};

MediaSaveService.prototype.updateMediaIndexByIdAsync = function (mediaId, newIndex, owner) {
	var defer = Q.defer();

	Media
		.findOne({ _id: mediaId, ownerId: owner.id })
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

MediaSaveService.prototype.removeMediaAsync = function (media, owner) {
	var removeMediumPromises = media.map(function(medium) {
		return this.removeMediumAsync(medium, owner);
	}, this);
	return Q.all(removeMediumPromises);
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