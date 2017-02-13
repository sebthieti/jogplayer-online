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
			$scope.editUserVm = null;
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

			$scope.addAllowedPathToNewUser = function(userVm) {
				userVm.model.permissions.allowPaths.push({ path: '' });
				//$scope.newAllowedPath = {};
				//$scope.canShowAddUserArea = true;
			};

			$scope.addDenyPathToNewUser = function(userVm) {
				userVm.model.permissions.denyPaths.push({ path: '' });
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

			$scope.removeAllowPath = function(allowPath, newUserVm) {
				newUserVm.model.permissions.allowPaths = _.filter(newUserVm.model.permissions.allowPaths, function(x) {
					return x !== allowPath;
				});
			};
			$scope.removeDenyPath = function(denyPath, newUserVm) {
				newUserVm.model.permissions.denyPaths = _.filter(newUserVm.model.permissions.denyPaths, function(x) {
					return x !== denyPath;
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

			$scope.submitUser = function() {
				$scope.editUserVm.isEditing = false;
				$scope.editUserVm.model.permissions.allowPaths = $scope.editUserVm.model.permissions.allowPaths.map(function(x) {
					return x.path;
				});
				$scope.editUserVm.model.permissions.denyPaths = $scope.editUserVm.model.permissions.denyPaths.map(function(x) {
					return x.path;
				});

				userBusiness
					.updateUserAsync($scope.editUserVm.model)
					.then(function(updatedUserModel) {
						var updatedUserVm = viewModelBuilder.buildEditableViewModel(updatedUserModel);
						updatedUserVm.isEditing = false;

						$scope.usersVm[_currentIndexEdited] = updatedUserVm;
						$scope.editUserVm = null;
						_currentIndexEdited = -1;
					});
				//userBusiness
				//	.updateUserAsync($scope.editUserVm)
				//	.then(function() {
				//		$scope.newUserVm = null;
				//	});
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
				$scope.editUserVm = userVm;
				userVm.isEditing = true;
			};

			//$scope.endEditUser = function(userVm) {
			//	userVm.isEditing = false;
			//	userBusiness
			//		.updateUserAsync(userVm.model)
			//		.then(function(updatedUserModel) {
			//			var updatedUserVm = viewModelBuilder.buildEditableViewModel(updatedUserModel);
			//			updatedUserVm.isEditing = false;
			//
			//			$scope.usersVm[_currentIndexEdited] = updatedUserVm;
			//			$scope.editUserVm = null;
			//			_currentIndexEdited = -1;
			//		});
			//};

			$scope.cancelEditUser = function(userVm) {
				userVm.isEditing = false;
				$scope.editUserVm = null;
			};

			userBusiness
				.observeUsers()
				.do(function(users) {
					$timeout(function() {
						var usersVm = users.map(function(x) {
							var vm = viewModelBuilder.buildEditableViewModel(x);
							vm.model.permissions.allowPaths = vm.model.permissions.allowPaths.map(function(y) {
								return { path: y }
							});
							vm.model.permissions.denyPaths = vm.model.permissions.denyPaths.map(function(y) {
								return { path: y }
							});
							return vm;
						});
						$scope.usersVm = usersVm;
					})
				})
				.silentSubscribe();
		}
	}
}]);