'use strict';

jpoApp.factory("fileExplorerService", function ($http, $q) {

	var explorerPathPattern = "/api/explore:path";

	var exploreFolder = function (folderPath) {
		var deferred = $q.defer();

		var pathUrl = explorerPathPattern.replace(':path', folderPath);

		$http.get(pathUrl)
			.then(function (result) {
				deferred.resolve(result.data);
			}, function (err) {
				deferred.reject(err);
			});

		return deferred.promise;
	};

	return {
		exploreFolder: exploreFolder
	}
});