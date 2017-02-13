'use strict';

jpoApp.factory("configService", function ($http, $q, jpoProxy) {
	return {
		sendPlayableTypes: function(playableTypes) {
			return jpoProxy.getApiLinkAsync('config')
				.then(function(link) {
					return $http.get(link);
				})
				.then(function (result) {
					return result.data;
				});
		}
	}
});