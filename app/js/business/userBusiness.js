'use strict';
// TODO This code should not be accessible from a non-admin
jpoApp.factory('userBusiness', ['$q', 'UserModel', 'authBusiness', function($q, UserModel, authBusiness) {
	//var linkHelper = Helpers.linkHelpers;

	var usersSubject = new Rx.BehaviorSubject();

	loadUsers();
	clearUsersOnUserLogoff();

	function observeUsers() {
		return usersSubject.whereIsDefined();
	}

	function observeCurrentUser() { // Used for eg. to update current user's name
	}

	function loadUsers() {
		authBusiness
			.observeAuthenticatedUser()
			.whereHasValue()
			.whereIsAdminOrRootUser()
			.do(function() {
				UserModel
					.getAllAsync()
					.then(function(users) {
						usersSubject.onNext(users);
					});
			})
			.silentSubscribe();
	}

	function clearUsersOnUserLogoff() {
		authBusiness
			.observeCurrentUserAuthentication()
			.whereIsNull()
			.do(function() {
				usersSubject.onNext(null);
			})
			.silentSubscribe();
	}

	function addUserAsync(userViewModel) {
		var deferred = $q.defer();

		observeUsers().getValueAsync(function(users) {
			//var userEntity = UserModel.createEntity(user);
			UserModel
				.addAsync(userViewModel.model)
				.then(function (newUser) {
					deferred.resolve(newUser);
					users = users.concat(newUser);
					usersSubject.onNext(users);
				});
		});

		return deferred.promise;
	}

	function updateUserAsync(userModel) {
		return userModel.updateAsync();
	}

	function removeUser(userModel) {
		return userModel
			.removeAsync()
			.then(function () {
				observeUsers().getValueAsync(function(users){
					var updatedUsers = deleteUser(users, userModel);
					usersSubject.onNext(updatedUsers);
				});
			});
	}

	function deleteUser(users, userToRemove) {
		return _.filter(users, function(user) {
			return user.id !== userToRemove.id;
		});
	}

	return {
		observeUsers: observeUsers,
		addUserAsync: addUserAsync,
		updateUserAsync: updateUserAsync,
		removeUser: removeUser
	}
}]);