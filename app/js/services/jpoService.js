'use strict';

jpoApp.factory("jpoService", ['$http', '$q', function ($http, $q) {
	var API_URL = "/api/";

	return {
		getApiMapAsync: function() {
			var deferred = $q.defer();

			$http.get(API_URL)
				.then(function (result) {
					deferred.resolve(result.data);
				}, function (err) {
					deferred.reject(err);
				});

			return deferred.promise;
		}
	}
}]);

jpoApp.factory("jpoProxy", ['$q', 'jpoService', function ($q, jpoService) {
	var cache = {};

	return {
		getApiMapAsync: function() {
			var deferred = $q.defer();

			if (cache.apiMap) {
				deferred.resolve(cache.apiMap.clone());
			} else {
				jpoService.getApiMapAsync()
					.then(function(apiMap) {
						cache.apiMap = apiMap;
						deferred.resolve(apiMap);
					});
			}

			return deferred.promise;
		},
		getApiLinkAsync: function(name) {
			var deferred = $q.defer();

			this.getApiMapAsync()
				.then(function(apiMap) {
					var apiLink = _.find(apiMap, function(link) {
						return link.rel === name;
					});
					if (angular.isUndefined(apiLink)) {
						throw new Error('Api with rel=' + name + ' could not be found;');
					}
					deferred.resolve(apiLink.href);
				});

			return deferred.promise;
		}
	}
}]);