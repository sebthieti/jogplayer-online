'use strict';

jpoApp.factory("fileExplorerService", function ($http, $q) {

	var EXPLORER_PATH_PATTERN = "/api/explore:path";

	var exploreFolder = function (folderPath) {
		var deferred = $q.defer();

		var pathUrl = EXPLORER_PATH_PATTERN.replace(':path', folderPath);

		$http.get(pathUrl)
			.then(function (result) {
				_.each(result.data, function(file) {
					insertfilePathToFile(file, folderPath);
				});
				deferred.resolve(result.data);
			}, function (err) {
				deferred.reject(err);
			});

		return deferred.promise;
	};

	var insertfilePathToFile = function(file, dirPath) {
		file.filePath = dirPath + file.name;
	};

	return {
		exploreFolder: exploreFolder
	}

});