'use strict';

jpoApp.directive("manageUsers", [
	'$timeout',
	'userBusiness',
	'viewModelBuilder',
	function($timeout, userBusiness, viewModelBuilder) {
	return {
		restrict: 'E',
		templateUrl: '/templates/controls/manageUsers.html',
		controller: function($scope) {
			var _currentIndexEdited = -1;

			$scope.newUser = null;
			$scope.canShowAddUserArea = false;

			$scope.beginAddUser = function() {
				$scope.newUser = {};
				$scope.canShowAddUserArea = true;
			};

			$scope.submitNewUser = function() {
				userBusiness
					.addUserAsync($scope.newUser)
					.then(function() {
						$scope.newUser = null;
					});
			};

			$scope.cancelAddUser = function() {
				$scope.newUser = null;
				$scope.canShowAddUserArea = false;
			};

			$scope.removeUser = function(userVm) {
				userBusiness.removeUser(userVm.model);
			};

			$scope.beginEditUser = function(userVm) {
				userVm.isEditing = true;
			};

			$scope.endEditUser = function(userVm) {
				userVm.isEditing = false;
				userBusiness
					.updateUserAsync(userVm.model)
					.then(function(updatedUserModel) {
						var updatedUserVm = viewModelBuilder.buildEditableViewModel(updatedUserModel);
						updatedUserVm.isEditing = false;

						$scope.usersVm[_currentIndexEdited] = updatedUserVm;
						_currentIndexEdited = -1;
					});
			};

			$scope.cancelEditUser = function(userVm) {
				userVm.isEditing = false;
			};

			userBusiness
				.observeUsers()
				.do(function(users) {
					$timeout(function() {
						var usersVm = users.map(viewModelBuilder.buildEditableViewModel);
						$scope.usersVm = usersVm;
					})
				})
				.silentSubscribe();
		}
	}
}]);