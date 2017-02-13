'use strict';

jpoApp.factory("fileExplorerService", function ($http, $q, jpoProxy) {
	return {
		getResourceAsync: function (link) { // TODO Move to more generic service
			return $http.get(link)
				.then(function (result) {
					return result.data;
				});
		},

		startExplore: function() {
			return jpoProxy.getApiLinkAsync('explore')
				.then(function(link) {
					return $http.get(link);
				})
				.then(function(result) {
					return result.data;
				});
		},

		exploreFolder: function (physFolderPath) {
			return jpoProxy.getApiLinkAsync('explore')
				.then(function(link) {
					if (link.endsWith('/')){
						link = link.substring(0, link.length-1);
					}
					var fullLink = link + physFolderPath;
					return $http.get(fullLink);
				});
		}
	}
});