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
		getFavoritesAsync: function () {
			return jpoProxy.getApiLinkAsync('favorites')
				.then(function(link) {
					return $http.get(link)
				})
				.then(function (result) {
					return result.data;
				});
		},

		addFavoriteAsync: function(favorite) {
			return jpoProxy.getApiLinkAsync('favorites')
				.then(function(link) {
					return $http.post(link, favorite)
				})
				.then(function (result) {
					return result.data;
				});
		},

		updateFavoriteAsync: function(favorite) {
			return $http({
				method: 'PATCH',
				url: selectActionFromLinks('update', favorite.links), data: favorite
			})
			.then(function (result) {
				return result.data;
			});
		},

		deleteFavoriteAsync: function(favorite) {
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