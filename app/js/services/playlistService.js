'use strict';

jpoApp.factory("playlistService", function ($http) {

	var playlistsUrlPattern = "/api/playlists/:id";

	var getPlaylists = function () {
		var deferred = $q.defer();
		var pathUrl = playlistsUrlPattern.replace(':path', '');

		$http.get(pathUrl)
			.then(function (result) {
				deferred.resolve(result.data);
			}, function (err) {
				deferred.reject(err);
			});

		deferred.promise;
	};

	var getPlaylistMedias = function (playlistId) {
		var deferred = $q.defer();
		var pathUrl = playlistsUrlPattern.replace(':path', playlistId);

		$http.get(pathUrl)
			.then(function (result) {
				deferred.resolve(result.data);
			}, function (err) {
				deferred.reject(err);
			});

		deferred.promise;
	};

	return {
		getPlaylists: getPlaylists,
		getPlaylistMedias: getPlaylistMedias
	}
});