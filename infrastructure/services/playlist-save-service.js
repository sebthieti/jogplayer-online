var Q = require('q');
var from = require('fromjs');
var mongodb = require('mongodb');
var Playlist = require('../entities/playlist');

var PlaylistSaveService = (function () {
	'use strict';

	function PlaylistSaveService(saveService) {

		this.getPlaylistsAsync = function() {
			return saveService
				.getPlaylistsRepositoryAsync()
				.then(selectAndSortPlaylistsAsync)
				.then(castPlaylistSetToEntitiesAsync);
		};

		this.getPlaylistAsync = function (playlistId) {
			return saveService
				.getPlaylistsRepositoryAsync()
				.then(function (playlistSet) { return findPlaylistById(playlistSet, playlistId) })
				.then(castDbPlaylistToEntityAsync);
		};

		this.getPlaylistsCountAsync = function () {
			return saveService.getPlaylistsRepositoryAsync()
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

		this.insertPlaylistAsync = function(playlist) {
			if (!playlist) {
				throw "PlaylistSaveService.insertPlaylistAsync: playlist must be set";
			}
			if (playlist._id) {
				throw "PlaylistSaveService.insertPlaylistAsync: playlist.Id should not be set"
			}

			return saveService
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

		this.updatePlaylistIdsPositionAsync = function (plIdIndexesToOffset) {
			return saveService
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

		this.getPlaylistIdsLowerThanAsync = function (index, includeSelf) {
			return saveService
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

		this.getPlaylistIdIndexesAsync = function () {
			return saveService
				.getPlaylistsRepositoryAsync()
				.then(selectAndSortPlaylistIdIndexesAsync)
				.then(function (playlistSet) { return Q.nfcall(playlistSet.toArray) });
		};

		this.findIndexesFromPlaylistIdsAsync = function(playlistIds) {
			return saveService
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

		this.removePlaylistsByIdAsync = function (playlistIds) {
			return saveService
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

		function selectAndSortPlaylistIdIndexesAsync(playlistSet) {
			return Q.fcall(function() {
				return playlistSet
					.find( {}, {index: 1} )
					.sort( {index: 1} );
			});
		}

		function selectAndSortPlaylistsAsync(playlistSet) {
			return Q.fcall(function() {
				return playlistSet
					.find( {}, {index: 1, plName: 1, isSelected: 1, createdOn: 1, updatedOn: 1} )
					.sort( {index: 1} );
			});
		}
		
		function filterPlaylistsLowerThanAsync(playlistSet, index, includeSelf) {
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
		}

		function findPlaylistById(playlistSet, playlistId) {
			return Q.promise(function(onSucceed, onError) {
				playlistSet.findOne(
					{ _id: mongodb.ObjectID(playlistId)},
					{ index: 1, plName: 1, isSelected: 1, createdOn: 1, updatedOn: 1 },
					function (err, playlist) {
						if (!err) {
							onSucceed(playlist);
						} else {
							onError(err);
						}
					}
				);
			});
		}

		function castDbPlaylistToEntityAsync(dbPlaylist) {
			if (!dbPlaylist) {
				return null;
			}
			return Playlist.fromDto(dbPlaylist);
		}

		function castPlaylistSetToEntitiesAsync(playlistSet) {
			return Q.promise(function (onSuccess, onError) {
				playlistSet.toArray(function (err, plArray) {
					if (!err) {
						var plEntities = from(plArray)
							.select(function(dtoPlaylist) { return Playlist.fromDto(dtoPlaylist) })
							.toArray();
						onSuccess(plEntities);
					} else {
						onError(err);
					}
				});
			});
		}
	}

	return PlaylistSaveService;
})();

module.exports = PlaylistSaveService;