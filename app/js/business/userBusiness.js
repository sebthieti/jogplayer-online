'use strict';

jpoApp.factory('userBusiness', ['$q', 'UserModel', 'authBusiness', function($q, UserModel, authBusiness) {
	//var linkHelper = Helpers.linkHelpers;

	var usersSubject = new Rx.BehaviorSubject();

	function observeUsers() {
		return usersSubject.whereIsDefined();
	}

	function observeCurrentUser() { // Used for eg. to update current user's name

	}

	function addUserAsync(user) {
		var deferred = $q.defer();

		observeUsers().getValueAsync(function(users) {
			//var userEntity = UserModel.createEntity(user);
			UserModel
				.addAsync(user)
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

	function loadUsers() {
		authBusiness
			.observeAuthenticatedUser()
			.asAsyncValue()
			.do(function(__) {
				UserModel
					.getAllAsync()
					.then(function(users) {
						usersSubject.onNext(users);
					});
			})
			.silentSubscribe();
	}

	loadUsers();

	return {
		observeUsers: observeUsers,
		addUserAsync: addUserAsync,
		updateUserAsync: updateUserAsync,
		removeUser: removeUser
	}
}]);