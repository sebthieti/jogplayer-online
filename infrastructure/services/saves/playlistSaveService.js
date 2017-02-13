var Q = require('q');
var from = require('fromjs');
var mongodb = require('mongodb');
var playlist = require('../../entities/playlist');

var PlaylistSaveService = (function () {
	'use strict';

	var _saveService;

	function PlaylistSaveService(saveService) {
		_saveService = saveService;
	}

	PlaylistSaveService.prototype.getPlaylistsAsync = function() {
		return _saveService
			.getPlaylistsRepositoryAsync()
			.then(selectAndSortPlaylistsAsync)
			.then(castPlaylistSetToEntitiesAsync);
	};

	PlaylistSaveService.prototype.getPlaylistAsync = function (playlistId) {
		return _saveService
			.getPlaylistsRepositoryAsync()
			.then(function (playlistSet) { return findPlaylistById(playlistSet, playlistId) })
			.then(castDbPlaylistToEntityAsync);
	};

	PlaylistSaveService.prototype.getPlaylistsCountAsync = function () {
		return _saveService.getPlaylistsRepositoryAsync()
			.then(function(playlists) {
				return Q.promise(function(onSuccess, onError) {
					playlists.count(function (err, count) { // TODO Retry change
						if (!err) {
							onSuccess(count);
						}
						else {
							onError(err);
						}
					});
				});
			})
	};

	PlaylistSaveService.prototype.insertPlaylistAsync = function(playlist) {
		if (!playlist) {
			throw "PlaylistSaveService.insertPlaylistAsync: playlist must be set";
		}
		if (playlist._id) {
			throw "PlaylistSaveService.insertPlaylistAsync: playlist.Id should not be set"
		}

		return _saveService
			.getPlaylistsRepositoryAsync()
			.then(function(playlists) {
				return Q.promise(function(onSuccess, onError) {
					playlist.createdOn = new Date().toJSON();
					playlists.insert(playlist, function (err, newPlaylist) {
						if (err) {
							onError(err);
						}
						else {
							onSuccess(newPlaylist[0]);
						}
					})
				});
			});
	};

	PlaylistSaveService.prototype.updatePlaylistIdsPositionAsync = function (plIdIndexesToOffset) {
		return _saveService
			.getPlaylistsRepositoryAsync()
			.then(function(playlistSet) {
				return Q.promise(function(onSuccess, onError) {
					for (var index = 0; index < plIdIndexesToOffset.length; index++) {
						playlistSet.update(
							{ _id: mongodb.ObjectID(plIdIndexesToOffset[index]._id) },
							{ $set: {index: plIdIndexesToOffset[index].index} },
							function(err, nModified) {
								if (!err && nModified == 1) {
									onSuccess();
								} else if (err) {
									onError(err);
								} else {
									onError('No playlist could be updated');
								}
							}
						);
					}
				})
			});
	};

	PlaylistSaveService.prototype.getPlaylistIdsLowerThanAsync = function (index, includeSelf) {
		return _saveService
			.getPlaylistsRepositoryAsync()
			.then(function (pls) { return filterPlaylistsLowerThanAsync(pls, index, includeSelf) })
			.then(function (playlistSet) { return Q.nfcall(playlistSet.toArray) })
			.then(function (playlistIdIndexesSet) {
				var playlistIdIndexes = [];
				var playlistIdIndexesLength = playlistIdIndexesSet.length;
				for (var index = 0; index < playlistIdIndexesLength; index++) {
					var key = playlistIdIndexesSet[index]._id.toString();
					playlistIdIndexes.push({_id: key, index: playlistIdIndexesSet[index].index});
				}
				return playlistIdIndexes;
			});
	};

	PlaylistSaveService.prototype.getPlaylistIdIndexesAsync = function () {
		return _saveService
			.getPlaylistsRepositoryAsync()
			.then(selectAndSortPlaylistIdIndexesAsync)
			.then(function (playlistSet) { return Q.nfcall(playlistSet.toArray) });
	};

	PlaylistSaveService.prototype.findIndexesFromPlaylistIdsAsync = function(playlistIds) {
		return _saveService
			.getPlaylistsRepositoryAsync()
			.then(function(playlistSet) {
				var query = [];
				var playlistIdsLength = playlistIds.length;
				for (var paramIndex = 0; paramIndex < playlistIdsLength; paramIndex++) {
					query.push( {_id: mongodb.ObjectID(playlistIds[paramIndex])} );
				}

				return Q.promise(function(onSucceed, onError) {
					playlistSet
						.find( { $or: query}, {index: 1} )
						.sort( {index: 1} )
						.toArray(function (err, plArray) {
							if (!err) {
								onSucceed(plArray);
							} else {
								onError(err);
							}
						});
				});
			});
	};

	PlaylistSaveService.prototype.removePlaylistsByIdAsync = function (playlistIds) {
		return _saveService
			.getPlaylistsRepositoryAsync()
			.then(function(playlistSet) {
				var query = [];
				var playlistIdsLength = playlistIds.length;
				for (var paramIndex = 0; paramIndex < playlistIdsLength; paramIndex++) {
					query.push( {_id: mongodb.ObjectID(playlistIds[paramIndex])} );
				}

				return Q.promise(function(onSuccess, onError) {
					playlistSet.remove(
						{ $or: query},
						function (err, nDeleted) {
							if (!err && nDeleted == query.length) {
								onSuccess();
							} else if (err) {
								onError(err);
							} else {
								onError('No playlist could be deleted');
							}
						}
					);
				});
			});
	};

	PlaylistSaveService.prototype.getMediaCountForPlaylistByIdAsync = function (playlistId) {
		throw "Not implemented";
	};

	var selectAndSortPlaylistIdIndexesAsync = function (playlistSet) {
		return Q.fcall(function() {
			return playlistSet
				.find( {}, {index: 1} )
				.sort( {index: 1} );
		});
	};

	var selectAndSortPlaylistsAsync = function (playlistSet) {
		return Q.fcall(function() {
			return playlistSet
				.find( {}, {index: 1, name: 1, isSelected: 1, createdOn: 1, updatedOn: 1} )
				.sort( {index: 1} );
		});
	};

	var filterPlaylistsLowerThanAsync = function (playlistSet, index, includeSelf) {
		return Q.fcall(function() {
			var query = null;
			if (includeSelf) {
				query = {index: {$gte: index }};
			} else {
				query = {index: {$gt: index }};
			}

			return playlistSet
				.find(query, {index: 1} )
				.sort({index: 1});
		});
	};

	var findPlaylistById = function (playlistSet, playlistId) {
		return Q.promise(function(onSucceed, onError) {
			playlistSet.findOne(
				{ _id: mongodb.ObjectID(playlistId)},
				{ index: 1, name: 1, isSelected: 1, createdOn: 1, updatedOn: 1 },
				function (err, playlist) {
					if (!err) {
						onSucceed(playlist);
					} else {
						onError(err);
					}
				}
			);
		});
	};

	var castDbPlaylistToEntityAsync = function (dbPlaylist) {
		if (!dbPlaylist) {
			return null;
		}
		return playlist.fromDto(dbPlaylist);
	};

	var castPlaylistSetToEntitiesAsync = function (playlistSet) {
		return Q.promise(function (onSuccess, onError) {
			playlistSet.toArray(function (err, plArray) {
				if (!err) {
					var plEntities = from(plArray)
						.select(function(dtoPlaylist) {
							return playlist.fromDto(dtoPlaylist)
						})
						.toArray();
					onSuccess(plEntities);
				} else {
					onError(err);
				}
			});
		});
	};

	return PlaylistSaveService;
})();

module.exports = PlaylistSaveService;