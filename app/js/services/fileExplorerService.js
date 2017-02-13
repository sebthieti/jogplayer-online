'use strict';

jpoApp.factory("fileExplorerService", function ($http, $q, jpoProxy) {
	return {
		startExplore: function() {
			return jpoProxy.getApiLink('explore')
				.then(function(link) {
					return $http.get(link);
				})
				.then(function(result) {
					return result.data;
				});
		},

		exploreFolder: function (physFolderPath) {
			return jpoProxy.getApiLink('explore')
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