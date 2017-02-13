'use strict';
angular.module('jpoApp.controllers', [])
  .controller('mainCtrl', [
    '$scope',
    '$timeout',
    'audioService',
    'authBusiness',
    'mediaQueueBusiness',
    'userStateBusiness',
    function ($scope, $timeout, audioService, authBusiness, mediaQueueBusiness, userStateBusiness) {
      $scope.currentUser = null;
      $scope.isAdmin = false;
      $scope.canShowMenu = false;
      $scope.canShowMediaQueue = false;
      $scope.manageUserVisible = false;
      $scope.toggleUserManager = function () {
        $scope.manageUserVisible = !$scope.manageUserVisible;
      };
      authBusiness
        .observeCurrentUserAuthentication()
        .do(function (user) {
          $timeout(function () {
            $scope.currentUser = user;
            $scope.canShowMenu = !!user;
            $scope.canShowMediaQueue = $scope.canShowMenu;
            if (!user) {
              $scope.manageUserVisible = false;
            } else {
              $scope.isAdmin = user.permissions.isAdmin || user.permissions.isRoot;
            }
          });
        })
        .silentSubscribe();
      $scope.logout = function () {
        authBusiness.logout();
      };
      audioService
        .observePlayingMedium()
        .select(function (x) {
          return x.model
        })
        .startWith(null)
        .do(function (medium) {
          if (!medium) {
            $scope.pageTitle = 'JogPlayer Online';
          } else {
            var nameOrTitle = medium.title || medium.name;
            $scope.pageTitle = nameOrTitle + " - JogPlayer Online";
          }
        })
        .silentSubscribe();

      userStateBusiness.init();
    }
  ]).controller('WelcomeController', [
  '$scope',
  '$http',
  'authBusiness',
  '$timeout',
  'loadBusiness',
  function ($scope, $http, authBusiness, $timeout, loadBusiness) {
    $scope.logonStatus = JpoAuthenticationStatus.Undetermined;
    $scope.showWelcome = true;
    $scope.logout = function () {
      authBusiness.logout();
    };
    $scope.canSubmit = false;
    function updateCanSubmit() {
      $scope.canSubmit =
        angular.isDefined($scope.username) && $scope.username !== '' &&
        angular.isDefined($scope.password) && $scope.password !== '';
    }

    $scope.$watch('username', updateCanSubmit);
    $scope.$watch('password', updateCanSubmit);
    $scope.submitCredentials = function () {
      authBusiness.login($scope.username, $scope.password);
    };
    loadBusiness
      .observeAllResourcesLoaded()
      .do(function () {
        $timeout(function () {
          $scope.showWelcome = false;
        });
      })
      .silentSubscribe();
    authBusiness
      .observeCurrentUserAuthentication()
      .do(function (user) {
        $timeout(function () {
          $scope.showLoginForm = (user === null);
          $scope.showWelcome = $scope.showLoginForm;
        });
      })
      .silentSubscribe();
    authBusiness
      .observeAuthenticationStatus()
      .do(function (authenticationStatus) {
        $timeout(function () {
          $scope.logonStatus = authenticationStatus;
        });
      })
      .silentSubscribe();
  }]);
