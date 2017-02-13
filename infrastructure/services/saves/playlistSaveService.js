'use strict';

var Q = require('q'),
	from = require('fromjs'),
	ReadWriteLock = require('rwlock'),
	lock = new ReadWriteLock();

var _saveService,
	_mediaSaveService,
	Playlist;

var PlaylistSaveService = function (saveService, mediaSaveService, playlistModel) {
	_saveService = saveService;
	_mediaSaveService = mediaSaveService;
	Playlist = playlistModel;
};

PlaylistSaveService.prototype.getPlaylistsAsync = function(issuer) {
	var defer = Q.defer();

	Playlist
		.find({ ownerId: issuer.id })
		.select('-media')
		.sort('index')
		.exec(function(err, playlists) {
			if (err) { defer.reject(err) }
			else { defer.resolve(playlists) }
		});

	return defer.promise;
};

PlaylistSaveService.prototype.getPlaylistWithMediaAsync = function (playlistId, issuer) {
	var defer = Q.defer();

	Playlist
		.findOne({ _id: playlistId, ownerId: issuer.id })
		.populate('media')
		.exec(function(err, playlist) {
			if (err) { defer.reject(err) }
			else { defer.resolve(playlist) }
		});

	return defer.promise;
};

PlaylistSaveService.prototype.getPlaylistsCountAsync = function (issuer) {
	var defer = Q.defer();

	Playlist.count({ ownerId: issuer.id }, function(err, playlistCount) {
		if (err) { defer.reject(err) }
		else { defer.resolve(playlistCount) }
	});

	return defer.promise;
};

PlaylistSaveService.prototype.getPlaylistIdsLowerThanAsync = function (index, includeSelf, issuer) {
	var defer = Q.defer();

	var queryIndex = includeSelf ? index : index + 1;
	Playlist
		.find({ ownerId: issuer.id })
		.where('index').gte(queryIndex)
		.sort('index')
		.select('index')
		.exec(function(err, playlistIdIndexesSet) {
			if (err) { defer.reject(err) }
			else { defer.resolve(playlistIdIndexesSet) }
		});

	return defer.promise;
};

PlaylistSaveService.prototype.getMediaIdsLowerThanAsync = function (playlistId, mediaIndex, includeSelf, issuer) {
	var defer = Q.defer();

	var queryIndex = includeSelf ? mediaIndex : mediaIndex + 1;
	Playlist
		.findOne({ _id: playlistId, ownerId: issuer.id })
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
};

PlaylistSaveService.prototype.getMediaCountForPlaylistByIdAsync = function (playlistId, issuer) {
	var defer = Q.defer();

	Playlist
		.findOne({ _id: playlistId, ownerId: issuer.id })
		.populate({
			path: 'media',
			select: '_id'
		})
		.exec(function(err, playlist) {
			if (!err && playlist) { defer.resolve(playlist.media.length) }
			else if (!playlist) {
				defer.reject("PlaylistId:" + playlistId + " doesn't exists");
			}
			else { defer.reject(err) }
		});

	return defer.promise;
};

PlaylistSaveService.prototype.getPlaylistIdIndexesAsync = function (issuer) {
	return this.findIndexesFromPlaylistIdsAsync(issuer);
};

PlaylistSaveService.prototype.findIndexFromPlaylistIdAsync = function(playlistId, issuer) {
	var defer = Q.defer();

	Playlist
		.findOne({ _id: playlistId, ownerId: issuer.id })
		.select('index')
		.exec(function(err, playlistIdIndex) {
			if (err) { defer.reject(err); }
			else { defer.resolve(playlistIdIndex); }
		});

	return defer.promise;
};

PlaylistSaveService.prototype.findIndexesFromPlaylistIdsAsync = function(playlistIds, issuer) {
	var defer = Q.defer();

	Playlist
		.find({ ownerId: issuer.id })
		.whereInOrGetAll('_id', playlistIds)
		.sort('index')
		.select('index')
		.exec(function(err, playlistIdIndexes) {
			if (err) { defer.reject(err); }
			else { defer.resolve(playlistIdIndexes); }
		});

	return defer.promise;
};

PlaylistSaveService.prototype.insertMediumToPlaylistAsync = function (playlistId, medium, issuer) {
	var defer = Q.defer();

	if (lock.writeLock(function (release) {
		Playlist
			.findOne({_id: playlistId, ownerId: issuer.id})
			.populate({path: 'media', select: '_id'})
			.exec(function (readError, playlist) {
				if (readError) {
					defer.reject(readError);
				} else if (!playlist) {
					defer.reject("PlaylistId:" + playlistId + " doesn't exists");
				} else {
					playlist.media = playlist.media.concat(medium);
					playlist.save(function (writeError) {
						if (writeError) {
							defer.reject(writeError);
						}
						else {
							defer.resolve(medium);
							release();
						}
					});
				}
			});
	}));

	return defer.promise;
};

PlaylistSaveService.prototype.insertMediaToPlaylistReturnSelfAsync = function (playlistId, mediaArray, issuer) {
	var defer = Q.defer();

	Playlist
		.findOne({ _id: playlistId, ownerId: issuer.id })
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
};

PlaylistSaveService.prototype.updatePlaylistIdsPositionAsync = function (plIdIndexesToOffset, issuer) {
	var updatePlaylistIdPositionPromises = plIdIndexesToOffset.map(function(value) {
		return this.updatePlaylistIdPositionAsync(value._id, value.index, issuer);
	}, this);
	return Q.all(updatePlaylistIdPositionPromises);
};

PlaylistSaveService.prototype.updatePlaylistIdPositionAsync = function (playlistId, newIndex, issuer) {
	var defer = Q.defer();

	Playlist
		.findOne({ _id: playlistId, ownerId: issuer.id })
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
};

PlaylistSaveService.prototype.updatePlaylistDtoAsync = function (playlistId, playlistDto, issuer) {
	var defer = Q.defer();

	Playlist.findOneAndUpdate(
		{ _id: playlistId, ownerId: issuer.id },
		playlistDto.getDefinedFields(),
		{ 'new': true } // Return modified doc.
	)
	.populate("media")
	.exec(
		function(err, playlist) {
			if (!err) { defer.resolve(playlist) }
			else { defer.reject(err) }
		});

	return defer.promise;
};

PlaylistSaveService.prototype.removePlaylistByIdAsync = function (playlistId, issuer) {
	var defer = Q.defer();

	Playlist
		.findOne({ _id: playlistId, ownerId: issuer.id })
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
};

PlaylistSaveService.prototype.removeMediaFromPlaylistAsync = function (playlistId, mediaId, issuer) {
	var defer = Q.defer();

	Playlist
		.findOne({ _id: playlistId, ownerId: issuer.id })
		.populate("media")
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
};

PlaylistSaveService.prototype.removeAllMediaFromPlaylistAsync = function (playlistId, issuer) {
	var defer = Q.defer();

	Playlist
		.findOne({ _id: playlistId, ownerId: issuer.id })
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
};

module.exports = PlaylistSaveService;
