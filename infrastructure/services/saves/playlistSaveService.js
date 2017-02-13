'use strict';

var Q = require('q'),
	from = require('fromjs');

var _saveService,
	_mediaSaveService,
	Playlist;

var PlaylistSaveService = function (saveService, mediaSaveService, playlistModel) {
	_saveService = saveService;
	_mediaSaveService = mediaSaveService;
	Playlist = playlistModel;
};

PlaylistSaveService.prototype = {

	getPlaylistsAsync: function() {
		var defer = Q.defer();

		Playlist
			.find({})
			.select('-media')
			.sort('index')
			.exec(function(err, playlists) {
				if (err) { defer.reject(err) }
				else { defer.resolve(playlists) }
			});

		return defer.promise;
	},

	getPlaylistWithMediaAsync: function (playlistId) {
		var defer = Q.defer();

		Playlist
			.findOne({ _id: playlistId })
			.populate('media')
			.exec(function(err, playlist) {
				if (err) { defer.reject(err) }
				else { defer.resolve(playlist) }
			});

		return defer.promise;
	},

	getPlaylistsCountAsync: function () {
		var defer = Q.defer();

		Playlist.count(function(err, playlistCount) {
			if (err) { defer.reject(err) }
			else { defer.resolve(playlistCount) }
		});

		return defer.promise;
	},

	getPlaylistIdsLowerThanAsync: function (index, includeSelf) {
		var defer = Q.defer();

		var queryIndex = includeSelf ? index : index + 1;
		Playlist
			.where('index').gte(queryIndex)
			.sort('index')
			.select('index')
			.exec(function(err, playlistIdIndexesSet) {
				if (err) { defer.reject(err) }
				else { defer.resolve(playlistIdIndexesSet) }
			});

		return defer.promise;
	},

	getMediaIdsLowerThanAsync: function (playlistId, mediaIndex, includeSelf) {
		var defer = Q.defer();

		var queryIndex = includeSelf ? mediaIndex : mediaIndex + 1;
		Playlist
			.findOne({ _id: playlistId })
			.populate({
				path: 'media',
				select: '_id',
				sort: 'index',
				match: { index: { $gte: queryIndex } }
			})
			.select('media')
			.exec(function(err, playlist) {
				if (err) { defer.reject(err) }
				else {
					defer.resolve(playlist.media.map(function(medium) {return medium._id}))
				}
			});

		return defer.promise;
	},

	getMediaCountForPlaylistByIdAsync: function (playlistId) {
		var defer = Q.defer();

		Playlist
			.findOne({ _id: playlistId })
			.populate({
				path: 'media',
				select: '_id'
			})
			.exec(function(err, playlist) {
				if (!err) { defer.resolve(playlist.media.length) }
				else { defer.reject(err) }
			});

		return defer.promise;
	},

	getPlaylistIdIndexesAsync: function () {
		return this.findIndexesFromPlaylistIdsAsync();
	},

	findIndexFromPlaylistIdAsync: function(playlistId) {
		var defer = Q.defer();

		Playlist
			.findOne({ _id: playlistId })
			.select('index')
			.exec(function(err, playlistIdIndex) {
				if (err) { defer.reject(err); }
				else { defer.resolve(playlistIdIndex); }
			});

		return defer.promise;
	},

	findIndexesFromPlaylistIdsAsync: function(playlistIds) {
		var defer = Q.defer();

		Playlist
			.whereInOrGetAll('_id', playlistIds)
			.sort('index')
			.select('index')
			.exec(function(err, playlistIdIndexes) {
				if (err) { defer.reject(err); }
				else { defer.resolve(playlistIdIndexes); }
			});

		return defer.promise;
	},

	insertMediaToPlaylistAsync: function (playlistId, mediaArray) {
		var defer = Q.defer();

		Playlist
			.findOne({ _id: playlistId })
			.populate({ path: 'media', select: '_id' })
			.exec(function(readError, playlist) {
				if (readError) {
					defer.reject(readError);
				} else {
					playlist.media = playlist.media.concat(mediaArray);
					playlist.save(function(writeError) {
						if (writeError) { defer.reject(writeError) }
						else { defer.resolve(mediaArray) }
					});
				}
			});

		return defer.promise;
	},

	insertMediaToPlaylistReturnSelfAsync: function (playlistId, mediaArray) {
		var defer = Q.defer();

		Playlist
			.findOne({ _id: playlistId })
			.populate({ path: 'media', select: '_id' })
			.exec(function(readError, playlist) {
				if (readError) {
					defer.reject(readError);
				} else {
					playlist.media = playlist.media.concat(mediaArray);
					playlist.save(function(writeError, savedPlaylist) {
						if (writeError) { defer.reject(writeError) }
						else { defer.resolve(savedPlaylist) }
					});
				}
			});

		return defer.promise;
	},

	updatePlaylistIdsPositionAsync: function (plIdIndexesToOffset) {
		var updatePlaylistIdPositionPromises = plIdIndexesToOffset.map(function(value) {
			return this.updatePlaylistIdPositionAsync(value._id, value.index);
		}, this);
		return Q.all(updatePlaylistIdPositionPromises);
	},

	updatePlaylistIdPositionAsync: function (playlistId, newIndex) {
		var defer = Q.defer();

		Playlist
			.findOne({ _id: playlistId })
			.select('index')
			.exec(function(readError, playlist) {
				if (readError) {
					defer.reject(readError);
				} else {
					playlist.index = newIndex;
					playlist.save(function(writeError, updatedPlaylist) {
						if (writeError) { defer.reject(writeError) }
						else { defer.resolve(updatedPlaylist) }
					});
				}
			});

		return defer.promise;
	},

	updatePlaylistDtoAsync: function (playlistId, playlistDto) {
		var defer = Q.defer();

		Playlist.findOneAndUpdate(
			{ _id: playlistId },
			playlistDto.getDefinedFields(),
			function(err, playlist) {
				if (!err) { defer.resolve(playlist) }
				else { defer.reject(err) }
			}
		);

		return defer.promise;
	},

	removePlaylistByIdAsync: function (playlistId) {
		var defer = Q.defer();

		Playlist
			.findOne({ _id: playlistId })
			.populate({ path: 'media', select: '_id' })
			.exec(function(err, playlist) {
				if (err) { defer.reject(err) }
				else {
					var removePromises = playlist.media.map(function(medium) {
						return _mediaSaveService.removeMediumAsync(medium);
					});

					Q.all(removePromises)
						.then(function() {
							playlist.remove(function(removeError, removedPlaylits) {
								if (!err) { defer.resolve(removedPlaylits) }
								else { defer.reject(err) }
							});
						})
						.catch(function(removeMediaError) {
							defer.reject(removeMediaError);
						})
						.done();
				}
			});

		return defer.promise;
	},

	removeMediaFromPlaylistAsync: function (playlistId, mediaId) {
		var defer = Q.defer();

		Playlist
			.findOne({ _id: playlistId })
			.populate({
				path: 'media',
				select: '_id'
			})
			.exec(function(err, playlist) {
				if (err) {
					defer.reject(err);
				} else {
					_mediaSaveService
						.removeMediumByIdAsync(mediaId)
						.then(function () {
							playlist.media = playlist.media.filter(function(medium) {
								return String(medium._id) !== mediaId;
							});
							playlist.save(function(saveError, savedPlaylist) {
								if (!err) { defer.resolve(savedPlaylist) }
								else { defer.reject(saveError) }
							});
						});
				}
			});

		return defer.promise;
	},

	removeAllMediaFromPlaylistAsync: function (playlistId) {
		var defer = Q.defer();

		Playlist
			.findOne({ _id: playlistId })
			.populate({
				path: 'media',
				select: '_id'
			})
			.exec(function(err, playlist) {
				if (err) {
					defer.reject(err);
				} else {
					_mediaSaveService
						.removeMediaAsync(playlist.media)
						.then(function() {
							playlist.media = [];
							playlist.save(function(saveError, savedPlaylist) {
								if (!err) { defer.resolve(savedPlaylist) }
								else { defer.reject(saveError) }
							});
						});
				}
			});

		return defer.promise;
	}

};

module.exports = PlaylistSaveService;