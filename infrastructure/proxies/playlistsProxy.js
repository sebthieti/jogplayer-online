var Q = require('q'),
	from = require('fromjs'),
	Rx = require("rx"),
	utils = require('../utils'),
	_globalCache = require("./").Cache;

var _playlistSaveService,
	_removePlaylistSubject = new Rx.Subject(),
	_insertPlaylistSubject = new Rx.Subject();

const PLAYLIST_GROUP = "playlist",
	PLAYLIST_COUNT_GROUP = "playlists.count",
	PLAYLIST_ID_INDEXES_GROUP = "playlistId.indexes",
	PLAYLIST_MEDIA_COUNT_GROUP = "playlist.media.count",
	PLAYLIST_IDS_LOWER_THAN = "playlistIdsLowerThan";

function PlaylistsProxy(playlistSaveService) {
	_playlistSaveService = playlistSaveService;
}

PlaylistsProxy.prototype.getPlaylistsCountAsync = function(user) {
	var deferred = Q.defer();

	var playlistCountFromCache = _globalCache.getItemFromCache(
		PLAYLIST_COUNT_GROUP,
		user.id
	);
	if (playlistCountFromCache != null) {
		deferred.resolve(playlistCountFromCache);
	} else {
		_playlistSaveService
			.getPlaylistsCountAsync(user)
			.then(function(cnt) {
				_globalCache.createOrUpdateItem(
					PLAYLIST_COUNT_GROUP,
					user.id,
					cnt
				);
				deferred.resolve(cnt);
			}, function(err) {
				deferred.reject(err);
			});
	}

	return deferred.promise;
};

PlaylistsProxy.prototype.saveNewPlaylist = function(playlist, user) {
	return utils
		.saveModelAsync(playlist)
		.then(function(playlist) {
			_insertPlaylistSubject.onNext({ playlist: playlist, user: user });
			return playlist;
		});
};

PlaylistsProxy.prototype.getPlaylistsAsync = function(user) {
	return _playlistSaveService.getPlaylistsAsync(user);
};

PlaylistsProxy.prototype.getPlaylistIdIndexesAsync = function(user) {
	var deferred = Q.defer();

	var playlistIdIndexes = _globalCache.getItemFromCache(
		PLAYLIST_ID_INDEXES_GROUP,
		user.id
	);
	if (playlists != null) {
		deferred.resolve(playlistIdIndexes);
	} else {
		_playlistSaveService
			.getPlaylistIdIndexesAsync(user)
			.then(function(playlistIdIndexes) {
				_globalCache.createOrUpdateItem(
					PLAYLIST_ID_INDEXES_GROUP,
					user.id,
					playlistIdIndexes
				);
				deferred.resolve(playlists);
			}, function(err) {
				deferred.reject(err);
			});
	}

	return deferred.promise;
};

PlaylistsProxy.prototype.getPlaylistIdsLowerThanAsync = function(desiredIndex, includeSelf, issuer) {
	var deferred = Q.defer();

	var compositeKey = {
		index: desiredIndex,
		includeSelf: includeSelf,
		issuerId: issuer.id
	};

	var playlistIdsLowerThanArray = _globalCache.getItemFromCache(PLAYLIST_IDS_LOWER_THAN, "entities");
	var playlistIdsLowerThanFromCache = from(playlistIdsLowerThanArray)
		.firstOrDefault(function(pl) {
			return pl.key.issuerId === compositeKey.issuerId &&
				pl.key.includeSelf === compositeKey.includeSelf &&
				pl.key.index === compositeKey.index;
		}, null);
	if (playlistIdsLowerThanFromCache != null) {
		deferred.resolve(playlistIdsLowerThanFromCache.value);
	} else {
		_playlistSaveService
			.getPlaylistIdsLowerThanAsync(desiredIndex, includeSelf, issuer)
			.then(function (plIdIndexesToOffset) {
				if (playlistIdsLowerThanArray != null) {
					playlistIdsLowerThanArray.push({
						key: compositeKey,
						value: plIdIndexesToOffset
					});
				} else {
					_globalCache.createOrUpdateItem(PLAYLIST_IDS_LOWER_THAN, "entities", [{
						key: compositeKey,
						value: plIdIndexesToOffset
					}]);
				}

				deferred.resolve(plIdIndexesToOffset)
			}, function (err) {
				deferred.reject(err);
			});
	}

	return deferred.promise;
};

PlaylistsProxy.prototype.playlistsPositionChangeByUserId = function(userId) {
	var playlistIdsLowerThan = _globalCache.getItemFromCache(PLAYLIST_IDS_LOWER_THAN, "entities");

	playlistIdsLowerThan = from(playlistIdsLowerThan)
		.where(function(obj) {
			return obj.key.issuerId !== userId;
		})
		.toArray();

	_globalCache.createOrUpdateItem(PLAYLIST_IDS_LOWER_THAN, "entities", playlistIdsLowerThan);
};

PlaylistsProxy.prototype.removePlaylistByIdAsync = function(playlistId, issuer) {
	return _playlistSaveService
		.removePlaylistByIdAsync(playlistId, issuer)
		.then(function() {
			_removePlaylistSubject.onNext(playlistId);
		});
};

PlaylistsProxy.prototype.observePlaylistRemoveById = function() {
	return _removePlaylistSubject;
};

PlaylistsProxy.prototype.observePlaylistInsertion = function() {
	return _insertPlaylistSubject;
};

PlaylistsProxy.prototype.invalidatePlaylistById = function(playlistId) {
	_globalCache.removeItem(PLAYLIST_GROUP, playlistId);
};

module.exports = PlaylistsProxy;