'use strict';

jpoApp.factory("fileExplorerService", ['$http', '$q', 'jpoProxy', function ($http, $q, jpoProxy) {
	return {
		startExplore: function() {
			return jpoProxy.getApiLinkAsync('explore')
				.then(function(link) {
					return $http.get(link);
				})
				.then(function(result) {
					return result.data;
				});
		}
	}
}]);