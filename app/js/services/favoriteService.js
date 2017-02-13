'use strict';

jpoApp.factory("favoriteService", function ($http, $q, jpoProxy) {
	var selectActionFromLinks = function(action, links) {
		var link = _.find(links, function(link) {
			return link.rel === action;
		});
		if (link) {
			return link.href;
		}
	};

	return {
		getFavorites: function () {
			return jpoProxy.getApiLink('favorites')
				.then(function(link) {
					return $http.get(link)
				})
				.then(function (result) {
					return result.data;
				});
		},

		addFavorite: function(favorite) {
			return jpoProxy.getApiLink('favorites')
				.then(function(link) {
					return $http.post(link, favorite)
				})
				.then(function (result) {
					return result.data;
				});
		},

		updateFavorite: function(favorite) {
			return $http
				.put(selectActionFromLinks('update', favorite.links), favorite)
				.then(function (result) {
					return result.data;
				});
		},

		deleteFavorite: function(favorite) {
			var deferred = $q.defer();

			$http.delete(selectActionFromLinks('remove', favorite.links))
				.then(function (result) {
					var removeSuccess = result.status === 204;
					if (removeSuccess) { deferred.resolve() }
					else { deferred.reject("Favorite with id " + favorite._id + " hasn't be deleted" ) }
				}, function (err) {
					deferred.reject(err);
				});

			return deferred.promise;
		}
	}
});