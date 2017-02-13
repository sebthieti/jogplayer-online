'use strict';

jpoApp.directive("fileExplorer", [
	'$window',
	'$http',
	'fileExplorerBusiness',
	'playlistExplorerBusiness',
	'FileNavigator',
	'viewModelBuilder',
	'mediaQueueBusiness',
	function ($window, $http, fileExplorerBusiness, playlistExplorerBusiness, FileNavigator, viewModelBuilder, mediaQueueBusiness) {
		return {
			base: null,
			restrict: 'E',
			templateUrl: '/templates/controls/fileExplorer.html',
			scope: {
				id: '@?',
				bindToFavorites: '=',
				isVisible: '=?',
				exploreWhenVisible: '=',
				selectedFiles: '=?',
				currentFolder: '=?'
			},
			controller: function ($scope) {
				var self = this;
				this.base = new FileNavigator();

				// TODO Temporary check. Check with better code (observ. sn/b subsc. if fileExp is the left one (no favs))
				var explorerBusiness = $scope.bindToFavorites ?
					fileExplorerBusiness :
					playlistExplorerBusiness;

				this.base.controller($scope, explorerBusiness);

				$scope.files = [];
				$scope.canExecuteFolderUp = false;
				$scope.isActive = false;
				$scope.folderViewModel = null;
				$scope.selectedFiles = null;
				$scope.hasMediaQueueAny = false;

				if ($scope.isVisible === undefined) {
					$scope.isVisible = true;
				}

				var exploringFiles = false;
				$scope.$watch("isVisible", function (isVisible, oldValue) {
					if (!exploringFiles && isVisible === true && $scope.exploreWhenVisible === true) {
						exploringFiles = true;
						startExplore();
					}
				});

				$scope.itemSelected = function (fileVm, byDblClick) {
					var isDir = !fileVm.model.type || fileVm.model.isDirectory();
					if (byDblClick) { // item: enqueue | folder: navigate
						if (isDir) {
							self.base.fileSelected(fileVm);
						} else {
							explorerBusiness.playMedium(fileVm);
						}
					} else { // item: select it | folder: navigate
						self.base.fileSelected(fileVm);
					}
				};

				$scope.innerPlayMedium = function (file) {
					explorerBusiness.playMedium(file);
				};

				$scope.exploreFileSystem = function () {
					startExplore();
				};

				var startExplore = function () {
					explorerBusiness.startExplore();
				};

				mediaQueueBusiness
					.observeMediaQueue()
					.whereHasValue()
					.select(function(x) {return _.any(x)})
					.do(function(hasMediaQueueAny) {
						$scope.hasMediaQueueAny = hasMediaQueueAny;
					})
					.silentSubscribe();

				explorerBusiness
					.observeCurrentFolderContent()
					.do(function (folderContent) {
						$scope.isActive = true;
						$scope.folderViewModel = viewModelBuilder.buildFolderContentViewModel(folderContent);
						$scope.currentFolder = folderContent.selectSelfPhysicalFromLinks();
					})
					.silentSubscribe();

				// TODO Handle a disposeWith method
				// TODO Remember that a failed Observable will end, so find a way to let it alive
			},
			link: function (scope, jqElement, attrs, controller) {
				controller.base.link(controller);

				scope.$watch("isVisible", function (isVisible, oldValue) {
					if (isVisible === true) {
						jqElement[0].classList.remove('ng-hide');
					} else {
						jqElement[0].classList.add('ng-hide');
					}
				});
			}
		};
}]);