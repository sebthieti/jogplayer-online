'use strict';

jpoApp.factory("favoriteService__", function ($http, $q, jpoProxy) {
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

		updateFavoriteAsync: function(favorite, updateLink) {
			return $http({
				method: 'PATCH',
				url: updateLink,
				data: favorite
			})
			.then(function (result) {
				return result.data;
			});
		},

		removeFavoriteAsync: function(removeLink) {
			var deferred = $q.defer();

			$http.delete(removeLink)
				.then(function (result) {
					var removeSuccess = result.status === 204;
					if (removeSuccess) { deferred.resolve() }
					else { deferred.reject("Favorite hasn't be deleted" ) }
				}, function (err) {
					deferred.reject(err);
				});

			return deferred.promise;
		}
	}
});