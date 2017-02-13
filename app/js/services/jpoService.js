'use strict';

jpoApp.factory("jpoService", function ($http, $q) {
	var API_URL = "/api/";

	return {
		getApiMap: function() {
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
});

jpoApp.factory("jpoProxy", function ($q, jpoService) {
	var cache = {};

	return {
		getApiMap: function() {
			var deferred = $q.defer();

			if (cache.apiMap) {
				deferred.resolve(cache.apiMap); // TODO  must be a copy
			} else {
				jpoService.getApiMap()
					.then(function(apiMap) {
						cache.apiMap = apiMap;
						deferred.resolve(apiMap);
					});
			}

			return deferred.promise;
		},
		getApiLink: function(name) {
			var deferred = $q.defer();

			this.getApiMap()
				.then(function(apiMap) {
					var apiLink = _.find(apiMap, function(link) {
						return link.rel === name;
					});
					deferred.resolve(apiLink.href);
				});

			return deferred.promise;
		}
	}
});