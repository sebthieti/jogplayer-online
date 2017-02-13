'use strict';

jpoApp.factory('authBusiness', [
	'$http',
	'AuthenticatedUserModel',
	'LogUserModel',
	'UserModel',
	'serviceFactory',
	function($http, AuthenticatedUserModel, LogUserModel, UserModel, serviceFactory) {
	var authenticationStatusSubject = new Rx.BehaviorSubject(JpoAuthenticationStatus.Undetermined);
	var currentUserAuthSubject = new Rx.BehaviorSubject();

	function observeAuthenticationStatus() {
		return authenticationStatusSubject;
	}

	function observeCurrentUserAuthentication() {
		return currentUserAuthSubject.whereIsDefined();
	}

	function observeAuthenticatedUser() {
		return currentUserAuthSubject.whereHasValue();//whereIsNotNull
	}

	function login(username, password) {
		authenticationStatusSubject.onNext(JpoAuthenticationStatus.LoggingIn);

		return LogUserModel
			.login(username, password)
			.then(function(user) {
				authenticationStatusSubject.onNext(JpoAuthenticationStatus.LoggedIn);
				currentUserAuthSubject.onNext(user)
			}, function(err) { // TODO May be another error than 401
				authenticationStatusSubject.onNext(JpoAuthenticationStatus.InvalidCredentials);
			});
	}

	function logout() {
		return $http.post('/api/logout', {})
			.then(function() {
				currentUserAuthSubject.onNext(null);
			});
	}

	function verifyCurrentUser() {
		return AuthenticatedUserModel
			.getAsync()
			.then(function(user) {
				currentUserAuthSubject.onNext(user);
			}, function() {
				currentUserAuthSubject.onNext(null);
				authenticationStatusSubject.onNext(JpoAuthenticationStatus.InvalidCredentials);
			});
	}

	function isUnauthorized(error) {
		return error.status === 401;
	}

	function observeOnUnauthorizedInvalidateUser() {
		serviceFactory
			.observeError()
			.where(isUnauthorized)
			.do(function() {
				currentUserAuthSubject.onNext(null);
				authenticationStatusSubject.onNext(JpoAuthenticationStatus.SessionExpired);
			})
			.silentSubscribe();
	}

	verifyCurrentUser();
	observeOnUnauthorizedInvalidateUser();

	return {
		observeAuthenticationStatus: observeAuthenticationStatus,
		observeCurrentUserAuthentication: observeCurrentUserAuthentication,
		observeAuthenticatedUser: observeAuthenticatedUser,
		login: login,
		logout: logout
	}
}]);