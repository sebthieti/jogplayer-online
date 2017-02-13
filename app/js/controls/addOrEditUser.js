'use strict';

jpoApp.directive("addOrEditUser", [
	'$timeout',
	'userBusiness',
	'authBusiness',
	'viewModelBuilder',
	function($timeout, userBusiness, authBusiness, viewModelBuilder) {
	return {
		restrict: 'E',
		scope: { userVm: '=?' },
		templateUrl: '/templates/controls/addOrEditUser.html',
		controller: function($scope) {
			$scope.canShowIdentityTab = true;
			$scope.canShowHomePathTab = false;
			$scope.canShowDenyPathsTab = false;
			$scope.homeFolderPath = "";
			$scope.canShowDenyPathsExplorer = false;
			$scope.tabSelected = function(tabName) {
				switch (tabName) {
					case "identity":
						$scope.canShowIdentityTab = true;
						$scope.canShowHomePathTab = false;
						$scope.canShowDenyPathsTab = false;
						break;
					case "homePath":
						$scope.canShowIdentityTab = false;
						$scope.canShowHomePathTab = true;
						$scope.canShowDenyPathsTab = false;
						break;
					case "denyPaths":
						$scope.canShowIdentityTab = false;
						$scope.canShowHomePathTab = false;
						$scope.canShowDenyPathsTab = true;
						break;
				}
			};

			//var _currentIndexEdited = -1;

			$scope.selectedDenyPath = "";

			$scope.isNewUser = $scope.userVm === undefined;
			$scope.isExistingUser = !$scope.isNewUser;

			function hasAdminPermissions() {
				return $scope.userVm.model.permissions &&
					($scope.userVm.model.permissions.isRoot
					||
					$scope.userVm.model.permissions.isAdmin);
			}

			if ($scope.isNewUser) {
				$scope.userVm = viewModelBuilder.buildEditableViewModel({
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
			} else {
				$scope.isRootUser = hasAdminPermissions();
			}

			$scope.canShowAddUserPanel = false;
			$scope.addDenyPathToNewUser = function(userVm) {
				userVm.model.permissions.denyPaths.push({ path: $scope.selectedDenyPath  });
				$scope.canShowDenyPathsList = true;
				$scope.canShowDenyPathsExplorer = !$scope.canShowDenyPathsList;
			};

			$scope.showDenyPathExplorer = function() {
				$scope.canShowDenyPathsExplorer = true;
				$scope.canShowDenyPathsList = !$scope.canShowDenyPathsExplorer;
			};
			$scope.canShowDenyPathsList = true;
			$scope.canShowDenyPathsExplorer = !$scope.canShowDenyPathsList;


			$scope.endAddAllowedPathNewUser = function(userVm) {
				userVm.model.permissions.allowPaths.push($scope.newAllowedPath);
				userBusiness
					.updateUserAsync(userVm.model)
					.then(function() {
						//$scope.newUser = null;
						$scope.canShowAddUserPanel = false;
					});
			};

			//$scope.removeAllowPath = function(allowPath, userVm) {
			//	userVm.model.permissions.allowPaths = _.filter(userVm.model.permissions.allowPaths, function(x) {
			//		return x !== allowPath;
			//	});
			//};
			$scope.removeDenyPath = function(denyPath, userVm) {
				userVm.model.permissions.denyPaths = _.filter(userVm.model.permissions.denyPaths, function(x) {
					return x !== denyPath;
				});
			};

			$scope.submitUser = function() {
				//$scope.editUserVm.isEditing = false;
				$scope.userVm.model.permissions.denyPaths = $scope.userVm.model.permissions.denyPaths.map(function(x) {
					return x.path;
				});

				if ($scope.isNewUser) {
					userBusiness
						.addUserAsync($scope.userVm)
						.then(function () {
							$scope.userVm = null;
						});
				} else {
					userBusiness
						.updateUserAsync($scope.userVm.model)
						.then(function(updatedUserModel) {
							$scope.userVm.isEditing = false;

							//var updatedUserVm = viewModelBuilder.buildEditableViewModel(updatedUserModel);
							//updatedUserVm.isEditing = false;

							// TODO This control should not change array
							//$timeout(function () {
							//$scope.usersVm = $scope.usersVm.concat(updatedUserVm);//[currentIndexEdited] = updatedUserVm;
							//});

							// Close current user view
							//$scope.editUserVm = null;
							//_currentIndexEdited = -1;
						});
				}
			};

			$scope.cancelAddAllowedPath = function() {
				$scope.newAllowedPath = null;
				//$scope.canShowAddAllowedPathArea = false;
			};

			$scope.cancelAddUser = function() {
				$scope.newUser = null;
				$scope.canShowAddUserPanel = false;
			};

			$scope.removeUser = function(userVm) {
				userBusiness.removeUser(userVm.model);
			};

			$scope.cancelEditUser = function(userVm) {
				userVm.isEditing = false;
				$scope.editUserVm = null;
			};
		}
	}
}]);
