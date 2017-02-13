'use strict';

jpoApp.factory("playlistService", function ($http, $q, jpoProxy) {
	var linkHelper = Helpers.linkHelpers;

	var addOrInsertMediaByFilePathToPlaylist = function (playlist, mediaFilePath, index) {
		return $http
			.post(linkHelper.selectActionFromLinks('media.insert', playlist.links), { index: index, mediaFilePath: mediaFilePath })
			.then(function (result) {
				return { playlist: playlist, newMedia: result.data};
			});
	};

	return {
		getPlaylists: function () {
			return jpoProxy.getApiLinkAsync('playlists')
				.then(function(link) {
					return $http.get(link);
				})
				.then(function (result) {
					return result.data;
				});
		},

		addPlaylist: function(playlist) {
			return jpoProxy.getApiLinkAsync('playlists')
				.then(function(link) {
					return $http.post(link, playlist)
				})
				.then(function (result) {
					return result.data;
				});
		},

		addPhysicalPlaylist: function(filePath) {
			return jpoProxy.getApiLinkAsync('playlists')
				.then(function(link) {
					return $http.post(link, {filePath: filePath})
				})
				.then(function (result) {
					return result.data;
				});
		},

		updatePlaylist: function (playlist) {
			return $http({ method: 'PATCH', url: linkHelper.selectActionFromLinks('update', playlist.links), data: playlist })
				//.patch(, )
				.then(function (result) {
					return result.data;
				});
		},

		removePlaylist: function(playlist) {
			var deferred = $q.defer();

			$http.delete(linkHelper.selectActionFromLinks('remove', playlist.links))
				.then(function (result) {
					var removeSuccess = result.status === 204;
					if (removeSuccess) { deferred.resolve() }
					else { deferred.reject("Playlist " + playlist.name + " hasn't be deleted" ) }
				}, function (err) {
					deferred.reject(err);
				});

			return deferred.promise;
		},

		// TODO rename to addMediumByFilePathToPlaylist
		addMediaByFilePathToPlaylist: function (playlist, mediaFilePaths) {
			return addOrInsertMediaByFilePathToPlaylist(playlist, mediaFilePaths[0], 'end');
		},

		insertMediaByFilePathToPlaylist: function (playlist, mediaFilePaths, index) {
			return addOrInsertMediaByFilePathToPlaylist(playlist, mediaFilePaths[0], index);
		},

		getPlaylistMedia: function (playlist) {
			return $http
				.get(linkHelper.selectActionFromLinks('media', playlist.links))
				.then(function (result) {
					return result.data;
				});
		},

		removeMediumFromPlaylist: function (media) {
			var deferred = $q.defer();

			return $http
				.delete(linkHelper.selectActionFromLinks('remove', media.links))
				.then(function (result) {
					var removeSuccess = result.status === 204;
					if (removeSuccess) { deferred.resolve() }
					else { deferred.reject("Media " + media._id + " from playlist " + media._playlistId + " hasn't be deleted" ) }
				});

			return deferred.promise;
		}
	}
});