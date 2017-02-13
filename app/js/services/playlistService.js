'use strict';

jpoApp.factory("playlistService", function ($http, $q, jpoProxy) {
	var selectActionFromLinks = function(action, links) {
		var link = _.find(links, function(link) {
			return link.rel === action;
		});
		if (link) {
			return link.href;
		}
	};

	var addOrInsertMediaByFilePathToPlaylist = function (playlist, mediaFilePaths, index) {
		return $http
			.post(selectActionFromLinks('media.insert', playlist.links), { index: index, mediaFilePaths: mediaFilePaths })
			.then(function (result) {
				return { playlist: playlist, newMedia: result.data};
			});
	};

	return {
		getPlaylists: function () {
			return jpoProxy.getApiLink('playlists')
				.then(function(link) {
					return $http.get(link);
				})
				.then(function (result) {
					return result.data;
				});
		},

		addPlaylist: function(playlist) {
			return jpoProxy.getApiLink('playlists')
				.then(function(link) {
					return $http.post(link, playlist)
				})
				.then(function (result) {
					return result.data;
				});
		},

		addPhysicalPlaylist: function(filePath) {
			return jpoProxy.getApiLink('playlists')
				.then(function(link) {
					return $http.post(link, {filePath: filePath})
				})
				.then(function (result) {
					return result.data;
				});
		},

		updatePlaylist: function (playlist) {
			return $http
				.put(selectActionFromLinks('update', playlist.links), playlist)
				.then(function (result) {
					return result.data;
				});
		},

		removePlaylist: function(playlist) {
			var deferred = $q.defer();

			$http.delete(selectActionFromLinks('remove', playlist.links))
				.then(function (result) {
					var removeSuccess = result.status === 204;
					if (removeSuccess) { deferred.resolve() }
					else { deferred.reject("Playlist " + playlist.name + " hasn't be deleted" ) }
				}, function (err) {
					deferred.reject(err);
				});

			return deferred.promise;
		},

		addMediaByFilePathToPlaylist: function (playlist, mediaFilePaths) {
			return addOrInsertMediaByFilePathToPlaylist(playlist, mediaFilePaths, 'end');
		},

		insertMediaByFilePathToPlaylist: function (playlist, mediaFilePaths, index) {
			return addOrInsertMediaByFilePathToPlaylist(playlist, mediaFilePaths, index);
		},

		getPlaylistMedia: function (playlist) {
			return $http
				.get(selectActionFromLinks('media', playlist.links))
				.then(function (result) {
					return result.data;
				});
		},

		removeMediumFromPlaylist: function (media) {
			var deferred = $q.defer();

			return $http
				.delete(selectActionFromLinks('remove', media.links))
				.then(function (result) {
					var removeSuccess = result.status === 204;
					if (removeSuccess) { deferred.resolve() }
					else { deferred.reject("Media " + media._id + " from playlist " + media._playlistId + " hasn't be deleted" ) }
				});

			return deferred.promise;
		}
	}
});