'use strict';

jpoApp.directive("manageUsers", [
	'$timeout',
	'userBusiness',
	'authBusiness',
	'viewModelBuilder',
	function($timeout, userBusiness, authBusiness, viewModelBuilder) {
	return {
		restrict: 'E',
		templateUrl: '/templates/controls/manageUsers.html',
		controller: function($scope) {
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
				$scope.canShowAddUserPanel = true;
			};

			$scope.beginAddAllowedPath = function() {
				$scope.newAllowedPath = {};
				//$scope.canShowAddAllowedPathArea = true;
			};

			$scope.beginEditUser = function(userVm) {
				//$scope.editUserVm = userVm;
				userVm.isEditing = true;
			};

			$scope.cancelAddAllowedPath = function() {
				$scope.newAllowedPath = null;
				//$scope.canShowAddAllowedPathArea = false;
			};

			$scope.cancelAddUser = function() {
				$scope.newUser = null;
				$scope.canShowAddUserArea = false;
				$scope.canShowAddUserPanel = false;
			};

			$scope.cancelEditUser = function(userVm) {
				userVm.isEditing = false;
			};

			$scope.removeUser = function(userVm) {
				userBusiness.removeUser(userVm.model);
			};

			$scope.beginEditUser = function(userVm) {
				$scope.editUserVm = userVm;
				userVm.isEditing = true;
			};

			$scope.cancelEditUser = function(userVm) {
				userVm.isEditing = false;
				$scope.editUserVm = null;
			};

			authBusiness
				.observeAuthenticatedUser()
				.where(function(user) {
					return user.permissions.isAdmin || user.permissions.isRoot})
				.selectMany(function() {
					return userBusiness.observeUsers();
				})
				.do(function(users) {
					$timeout(function() {
						if (users == null) {
							$scope.usersVm = null;
							return;
						}
						var usersVm = users.map(function(x) {
							var vm = viewModelBuilder.buildEditableViewModel(x);
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