'use strict';

jpoApp.factory("favoriteService", function ($http, $q) {

	var FAVORITE_PATH_PATTERN = "/api/favorites/:favId";

	var getFavorites = function () {
		var deferred = $q.defer();

		var pathUrl = FAVORITE_PATH_PATTERN.replace(':favId', '');

		$http.get(pathUrl)
			.then(function (result) {
				deferred.resolve(result.data);
			}, function (err) {
				deferred.reject(err);
			});

		return deferred.promise;
	};

	var addFavorite = function(favorite) {
		var deferred = $q.defer();

		var pathUrl = FAVORITE_PATH_PATTERN.replace(':favId', '');

		$http.post(pathUrl, favorite)
			.then(function (result) {
				deferred.resolve(result.data);
			}, function (err) {
				deferred.reject(err);
			});

		return deferred.promise;
	};

	var updateFavorite = function(favorite) {
		var deferred = $q.defer();

		var pathUrl = FAVORITE_PATH_PATTERN.replace(':favId', favorite._id);

		$http.put(pathUrl, favorite)
			.then(function (result) {
				deferred.resolve(result.data);
			}, function (err) {
				deferred.reject(err);
			});

		return deferred.promise;
	};

	var deleteFavorite = function(favId) {
		var deferred = $q.defer();

		var pathUrl = FAVORITE_PATH_PATTERN.replace(':favId', favId);

		$http.delete(pathUrl)
			.then(function (result) {
				deferred.resolve(result);
			}, function (err) {
				deferred.reject(err);
			});

		return deferred.promise;
	};

	return {
		getFavorites: getFavorites,
		addFavorite: addFavorite,
		updateFavorite: updateFavorite,
		deleteFavorite: deleteFavorite
	}
});