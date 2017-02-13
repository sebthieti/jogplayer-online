'use strict';

//jpoApp.factory("favoriteService", ['ServiceBase', function (ServiceBase) {
//	function FavoriteService() {
//		ServiceBase.call(this, 'favorites');
//	}
//	FavoriteService.prototype = Object.create(ServiceBase.prototype);
//	FavoriteService.prototype.constructor = ServiceBase;
//
//	return new FavoriteService();
//}]);

jpoApp.factory("serviceProxy", function ($http, $q, jpoProxy) {
	function ServiceBase(serviceName) {
		this._serviceName = serviceName;
	}
	ServiceBase.prototype.getAsync = function () {
		return jpoProxy.getApiLinkAsync(this._serviceName)
			.then(function(link) {
				return $http.get(link)
			})
			.then(function (result) {
				return result.data;
			});
	};

	ServiceBase.prototype.getByLinkAsync = function (link) {
		return $http.get(link)
			.then(function (result) {
				return result.data;
			});
	};

	ServiceBase.prototype.addAsync = function(model) {
		return jpoProxy.getApiLinkAsync(this._serviceName)
			.then(function(link) {
				return $http.post(link, model)
			})
			.then(function (result) {
				return result.data;
			});
	};

	ServiceBase.prototype.addByLinkAsync = function(link, model) {
		return $http.post(link, model)
			.then(function (result) {
				return result.data;
			});
	};
	//insertMediumByFilePathToPlaylist: function (playlist, mediaFilePath, index) {
	//	return addOrInsertMediumByFilePathToPlaylist(playlist, mediaFilePath, index);
	//},
	//addMediumByFilePathToPlaylist: function (playlist, mediaFilePath) {
	//	return addOrInsertMediumByFilePathToPlaylist(playlist, mediaFilePath, 'end');
	//},
	//var addOrInsertMediumByFilePathToPlaylist = function (playlist, mediaFilePath, index) {
	//	return $http
	//		.post(
	//			linkHelper.selectActionFromLinks('media.insert', playlist.links),
	//			{ index: index, mediaFilePath: mediaFilePath }
	//		)
	//		.then(function (result) {
	//			return { playlist: playlist, newMedia: result.data};
	//		});
	//};

	ServiceBase.prototype.updateAsync = function(model, updateLink) {
		return $http({
			method: 'PATCH',
			url: updateLink,
			data: model
		})
		.then(function (result) {
			return result.data;
		});
	};

	ServiceBase.prototype.removeAsync = function(removeLink) {
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
	};

	var serviceByNameStore = {};

	return { // serviceProxy
		getServiceFor: function(endpointName) {
			if (!serviceByNameStore[endpointName]) {
				serviceByNameStore[endpointName] = new ServiceBase(endpointName);
			}
			return serviceByNameStore[endpointName];
		}
	}
});