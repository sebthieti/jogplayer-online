'use strict';

jpoApp.factory("playlistService", function ($http, $q) {
	var PLAYLISTS_URL_PATTERN = "/api/playlists/:playlistId";
	var PLAYLISTS_MEDIA_URL_PATTERN = "/api/playlists/:playlistId/media/:mediaId";
	var PARAM_PLAYLIST_ID = ':playlistId';
	var PARAM_MEDIA_ID = ':mediaId';

	var addOrInsertMediaByFilePathToPlaylist = function (playlistId, mediaFilePaths, index) {
		var deferred = $q.defer();
		var pathUrl = PLAYLISTS_MEDIA_URL_PATTERN
			.replace(PARAM_PLAYLIST_ID, playlistId)
			.replace(PARAM_MEDIA_ID, '');

		$http.post(pathUrl, { index: index, mediaFilePaths: mediaFilePaths })
			.then(function (result) {
				deferred.resolve({ playlistId: playlistId, newMedia: result.data});
			}, function (err) {
				deferred.reject(err);
			});

		return deferred.promise;
	};

	return {
		getPlaylists: function () {
			var deferred = $q.defer();
			var pathUrl = PLAYLISTS_URL_PATTERN.replace(PARAM_PLAYLIST_ID, '');

			$http.get(pathUrl)
				.then(function (result) {
					deferred.resolve(result.data);
				}, function (err) {
					deferred.reject(err);
				});

			return deferred.promise;
		},

		addPlaylist: function(playlist) {
			var deferred = $q.defer();
			var pathUrl = PLAYLISTS_URL_PATTERN.replace(PARAM_PLAYLIST_ID, '');

			$http.post(pathUrl, playlist)
				.then(function (result) {
					deferred.resolve(result.data);
				}, function (err) {
					deferred.reject(err);
				});

			return deferred.promise;
		},

		updatePlaylist: function (playlist) {
			var deferred = $q.defer();
			var pathUrl = PLAYLISTS_URL_PATTERN.replace(PARAM_PLAYLIST_ID, playlist._id);

			$http.put(pathUrl, playlist)
				.then(function (result) {
					deferred.resolve(result.data);
				}, function (err) {
					deferred.reject(err);
				});

			return deferred.promise;
		},

		removePlaylist: function(playlist) {
			var deferred = $q.defer();
			var pathUrl = PLAYLISTS_URL_PATTERN.replace(PARAM_PLAYLIST_ID, playlist._id);

			$http.delete(pathUrl)
				.then(function (result) {
					var removeSuccess = result.status === 204;
					if (removeSuccess) { deferred.resolve() }
					else { deferred.reject("Playlist " + playlist.name + " hasn't be deleted" ) }
				}, function (err) {
					deferred.reject(err);
				});

			return deferred.promise;
		},

		addMediaByFilePathToPlaylist: function (playlistId, mediaFilePaths) {
			return addOrInsertMediaByFilePathToPlaylist(playlistId, mediaFilePaths, 'end');
		},

		insertMediaByFilePathToPlaylist: function (playlistId, mediaFilePaths, index) {
			return addOrInsertMediaByFilePathToPlaylist(playlistId, mediaFilePaths, index);
		},

		getPlaylistMedia: function (playlistId) {
			var deferred = $q.defer();
			var pathUrl = PLAYLISTS_URL_PATTERN.replace(PARAM_PLAYLIST_ID, playlistId);

			$http.get(pathUrl)
				.then(function (result) {
					deferred.resolve(result.data);
				}, function (err) {
					deferred.reject(err);
				});

			return deferred.promise;
		},

		removeMediaFromPlaylist: function (playlistId, mediaId) {
			var deferred = $q.defer();
			var pathUrl = PLAYLISTS_MEDIA_URL_PATTERN
				.replace(PARAM_PLAYLIST_ID, playlistId)
				.replace(PARAM_MEDIA_ID, mediaId);

			$http.delete(pathUrl)
				.then(function (result) {
					var removeSuccess = result.status === 204;
					if (removeSuccess) { deferred.resolve() }
					else { deferred.reject("Media " + mediaId + " from playlist " + playlistId + " hasn't be deleted" ) }
				}, function (err) {
					deferred.reject(err);
				});

			return deferred.promise;
		}
	}
});