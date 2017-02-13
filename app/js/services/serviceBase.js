'use strict';

jpoApp.factory("serviceProxy", function ($http, $q, jpoProxy) {
	var errorSubject = new Rx.Subject();

	function ServiceBase(serviceName) {
		this._serviceName = serviceName;
	}

	ServiceBase.prototype.getAsync = function () {
		var deferred = $q.defer();

		jpoProxy.getApiLinkAsync(this._serviceName)
			.then(function(link) {
				return $http.get(link)
			})
			.then(function (result) {
				deferred.resolve(result.data);
			}, function(err) {
				deferred.reject(err);
				errorSubject.onNext(err);
			});

		return deferred.promise;
	};

	ServiceBase.prototype.getByLinkAsync = function (link) {
		var deferred = $q.defer();

		$http.get(link)
			.then(function (result) {
				deferred.resolve(result.data);
			}, function(err) {
				deferred.reject(err);
				errorSubject.onNext(err);
			});

		return deferred.promise;
	};

	ServiceBase.prototype.addAsync = function(model) {
		var deferred = $q.defer();

		jpoProxy.getApiLinkAsync(this._serviceName)
			.then(function(link) {
				return $http.post(link, model)
			})
			.then(function (result) {
				deferred.resolve(result.data);
			}, function(err) {
				deferred.reject(err);
				errorSubject.onNext(err);
			});

		return deferred.promise;
	};

	ServiceBase.prototype.addByLinkAsync = function(link, model) {
		var deferred = $q.defer();

		$http.post(link, model)
			.then(function (result) {
				deferred.resolve(result.data);
			}, function(err) {
				deferred.reject(err);
				errorSubject.onNext(err);
			});

		return deferred.promise;
	};

	ServiceBase.prototype.updateAsync = function(model, updateLink) {
		var deferred = $q.defer();

		$http({
			method: 'PATCH',
			url: updateLink,
			data: model
		})
		.then(function (result) {
			deferred.resolve(result.data);
		}, function(err) {
			deferred.reject(err);
			errorSubject.onNext(err);
		});

		return deferred.promise;
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
				errorSubject.onNext(err);
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
		},

		observeError: function() {
			return errorSubject;
		}
	}
});