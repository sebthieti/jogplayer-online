var Q = require('q'),
	from = require('fromjs'),
	Rx = require('rx'),
	_globalCache = require("./").Cache;

var _playlistSaveService,
	_plUpdateSubject = new Rx.Subject();

const PLAYLIST_GROUP = "playlist",
	PLAYLIST_COUNT_GROUP = "playlist.count",
	PLAYLIST_MEDIA_COUNT_GROUP = "playlist.media.count",
	MEDIA_IDS_LOWER_THAN = "mediaIdsLowerThan";

function PlaylistProxy(playlistSaveService) {
	_playlistSaveService = playlistSaveService;
}

PlaylistProxy.prototype.updatePlaylistDtoAsync = function(playlistId, playlistDto, issuer) {
	return _playlistSaveService
		.updatePlaylistDtoAsync(playlistId, playlistDto, issuer)
		.then(function(playlist) {
			_globalCache.createOrUpdateItem(PLAYLIST_GROUP, playlist.id, playlist);
			return playlist;
		});
};

PlaylistProxy.prototype.getPlaylistWithMediaAsync = function(playlistId, issuer) {
	var deferred = Q.defer();

	var playlist = _globalCache.getItemFromCache(PLAYLIST_GROUP, playlistId);
	if (playlist != null) {
		deferred.resolve(playlist);
	} else {
		_playlistSaveService
			.getPlaylistWithMediaAsync(playlistId, issuer)
			.then(function (playlist) {
				_globalCache.createOrUpdateItem(PLAYLIST_GROUP, playlistId, playlist);
				deferred.resolve(playlist);
			})
			.catch(function (err) {
				deferred.reject(err);
			});
	}

	return deferred.promise;
};

PlaylistProxy.prototype.removeAllMediaFromPlaylistAsync = function(playlist, issuer) {
	return _playlistSaveService
		.removeAllMediaFromPlaylistAsync(playlist.id, issuer)
		.then(function(playlist) {
			_globalCache.createOrUpdateItem(PLAYLIST_GROUP, playlist.id, playlist);
			return playlist;
		});
};

PlaylistProxy.prototype.getMediaCountForPlaylistByIdAsync = function(playlistId, issuer) {
	var deferred = Q.defer();

	var playlistMediaCountFromCache = _globalCache.getItemFromCache(PLAYLIST_MEDIA_COUNT_GROUP, playlistId);
	if (playlistMediaCountFromCache != null) {
		deferred.resolve(playlistMediaCountFromCache);
	} else {
		_playlistSaveService
			.getMediaCountForPlaylistByIdAsync(playlistId, issuer)
			.then(function(cnt) {
				_globalCache.createOrUpdateItem(PLAYLIST_MEDIA_COUNT_GROUP, playlistId, cnt);
				deferred.resolve(cnt);
			}, function(err) {
				deferred.reject(err);
			});
	}

	return deferred.promise;
};

PlaylistProxy.prototype.insertMediaToPlaylistAsync = function(playlistId, unlinkedMedium, issuer) {
	return _playlistSaveService
		.insertMediaToPlaylistAsync(playlistId, unlinkedMedium, issuer)
		.then(function(media) {
			_globalCache.removeItem(PLAYLIST_GROUP, playlistId);
			return media;
		});
};

PlaylistProxy.prototype.updatePlaylistIdsPositionAsync = function(plIdIndexesToOffset, issuer) {
	return _playlistSaveService
		.updatePlaylistIdsPositionAsync(plIdIndexesToOffset, issuer)
		.then(function(updatedPlaylists) {
			updatedPlaylists.forEach(function(playlist) {
				_globalCache.createOrUpdateItem(PLAYLIST_GROUP, playlist.id, playlist);
			});
			_plUpdateSubject.onNext(issuer.id);
			return updatedPlaylists;
		});
};

PlaylistProxy.prototype.observeUpdatePlaylistIdsPosition = function() {
	return _plUpdateSubject;
};

PlaylistProxy.prototype.getPlaylistsCountAsync = function(issuer) {
	var deferred = Q.defer();

	var playlistCount = _globalCache.getItemFromCache(PLAYLIST_COUNT_GROUP, issuer.id);
	if (playlistCount != null) {
		deferred.resolve(playlistCount);
	} else {
		_playlistSaveService
			.getPlaylistsCountAsync(issuer)
			.then(function(count) {
				_globalCache.createOrUpdateItem(PLAYLIST_COUNT_GROUP, issuer.id, count);
				deferred.resolve(playlistCount);
			});
	}

	return deferred.promise;
};

PlaylistProxy.prototype.removeMediaFromPlaylistAsync = function(playlistId, mediaId, issuer) {
	return _playlistSaveService
		.removeMediaFromPlaylistAsync(playlistId, mediaId, issuer)
		.then(function(playlist) {
			_globalCache.createOrUpdateItem(PLAYLIST_GROUP, playlistId, playlist);
			return playlist;
		});
};

PlaylistProxy.prototype.getMediaIdsLowerThanAsync = function(playlistId, mediaIndex, includeSelf, issuer) {
	var deferred = Q.defer();

	var compositeKey = {
		playlistId: playlistId,
		mediaIndex: mediaIndex,
		includeSelf: includeSelf,
		issuerId: issuer.id
	};

	var mediaIdsLowerThanArray = _globalCache.getItemFromCache(MEDIA_IDS_LOWER_THAN, "entities");
	var playlistCountFromCache = from(mediaIdsLowerThanArray)
		.firstOrDefault(function(pl) {
			return pl.key.playlistId === compositeKey.playlistId &&
				pl.key.mediaIndex === compositeKey.mediaIndex &&
				pl.key.includeSelf === compositeKey.includeSelf &&
				pl.key.issuerId === compositeKey.issuerId;
		}, null);

	if (playlistCountFromCache != null) {
		deferred.resolve(playlistCountFromCache.value);
	} else {
		_playlistSaveService
			.getMediaIdsLowerThanAsync(playlistId, mediaIndex, includeSelf, issuer)
			.then(function (mediaIdIndexesToOffset) {
				mediaIdsLowerThanArray = _globalCache.createOrUpdateItem(MEDIA_IDS_LOWER_THAN, "entities", []);
				mediaIdsLowerThanArray.value.push({
					key: compositeKey,
					value: mediaIdIndexesToOffset
				});

				deferred.resolve(mediaIdIndexesToOffset)
			}, function (err) {
				deferred.reject(err);
			});
	}

	return deferred.promise;
};

PlaylistProxy.prototype.insertMediaToPlaylistReturnSelfAsync = function(emptyPlaylistId, media, issuer) {
	return _playlistSaveService
		.insertMediaToPlaylistReturnSelfAsync(
			emptyPlaylistId,
			media,
			issuer
		).then(function(playlist) {
			_globalCache.createOrUpdateItem(PLAYLIST_GROUP, playlist.id, playlist);
			return playlist;
		})
};

PlaylistProxy.prototype.playlistRemovedById = function(playlistId) {
	this.invalidatePlaylistById(playlistId);
};

PlaylistProxy.prototype.playlistInserted = function(playlist) {
	_globalCache.createOrUpdateItem(PLAYLIST_GROUP, playlist.id, playlist);
};

PlaylistProxy.prototype.invalidatePlaylistById = function(playlistId) {
	_globalCache.removeItem(PLAYLIST_GROUP, playlistId);//.createOrUpdateItem(PLAYLIST_GROUP, playlistId, null);
};

module.exports = PlaylistProxy;