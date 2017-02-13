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

			$scope.newUserVm = null;
			$scope.canShowAddUserArea = false;
			$scope.canShowAddAllowedPathArea = true;

			$scope.beginAddUser = function() {
				$scope.newUserVm = viewModelBuilder.buildEditableViewModel({
					isActive: true,
					fullName: '',
					username: '',
					password: '',
					email: '',
					permissions: {
						isAdmin: false,
						canWrite: false,
						allowPaths: [],
						denyPaths: [],
						homePath: ''
					}
				});
				$scope.canShowAddUserArea = true;
			};

			$scope.beginAddAllowedPath = function() {
				$scope.newAllowedPath = {};
				//$scope.canShowAddAllowedPathArea = true;
			};

			$scope.addAllowedPathToNewUser = function() {
				$scope.newUserVm.model.permissions.allowPaths.push({ path: '' });
				//$scope.newAllowedPath = {};
				//$scope.canShowAddUserArea = true;
			};

			$scope.addDenyPathToNewUser = function() {
				$scope.newUserVm.model.permissions.denyPaths.push({ path: '' });
				//$scope.newAllowedPath = {};
				//$scope.canShowAddUserArea = true;
			};



			//$scope.endAddAllowedPath = function(userVm) {
			//	userVm.model.permissions.allowPaths.push($scope.newAllowedPath);
			//	userBusiness
			//		.updateUserAsync(userVm.model)
			//		.then(function() {
			//			//$scope.newUser = null;
			//		});
			//};

			$scope.endAddAllowedPathNewUser = function(userVm) {
				userVm.model.permissions.allowPaths.push($scope.newAllowedPath);
				userBusiness
					.updateUserAsync(userVm.model)
					.then(function() {
						//$scope.newUser = null;
						$scope.canShowAddUserArea = false;
					});
			};

			$scope.submitNewUser = function() {
				$scope.newUserVm.model.permissions.allowPaths = $scope.newUserVm.model.permissions.allowPaths.map(function(x) {
					return x.path;
				});
				$scope.newUserVm.model.permissions.denyPaths = $scope.newUserVm.model.permissions.denyPaths.map(function(x) {
					return x.path;
				});

				userBusiness
					.addUserAsync($scope.newUserVm)
					.then(function() {
						$scope.newUserVm = null;
					});
			};

			$scope.cancelAddAllowedPath = function() {
				$scope.newAllowedPath = null;
				//$scope.canShowAddAllowedPathArea = false;
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