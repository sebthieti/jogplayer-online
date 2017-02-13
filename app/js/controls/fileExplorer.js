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
				bindToFavorites: '='
			},
			controller: function ($scope) {
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

				$scope.$watch("isVisible", function (isVisible, oldValue) {
					if (isVisible &&//$scope.isVisible &&
						//$scope.isVisible == true &&
						$scope.exploreWhenVisible &&
						$scope.exploreWhenVisible == true) {
						//if (!currentFolder) {
						explorerBusiness.startExplore();
						//}
					}
				});

				$scope.innerPlayMedia = function (file) {
					explorerBusiness.playMedium(file);
				};

				this.exploreFileSystem = function () {
					startExplore();
				};

				this.observeSelectedFiles = function () {
					return Rx.Observable.create(function(observer) {
						$scope.$watch("selectedFiles", function (selectedFiles) {
							observer.onNext(selectedFiles);
						});
					});
				};

				$scope.exploreFileSystem = function () {
					startExplore();
				};

				var startExplore = function () {
					explorerBusiness.startExplore();
				};

				mediaQueueBusiness
					.observeMediaQueue()
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
					})
					.silentSubscribe();

				// TODO Handle a disposeWith method
				// TODO Remember that a failed Observable will end, so find a way to let it alive
			},
			link: function (scope, element, attrs, controller) {
				controller.base.link(controller);
			}
		};
}]).
directive('isVisible', function() {
	return {
		restrict: 'A',
		require: 'fileExplorer',
		link: function(scope, jqElement, attr, controller) {
			scope.$watch(attr.isVisible, function (newValue, oldValue){
				scope.isVisible = newValue;
				if (newValue === true) {
					jqElement[0].classList.remove('ng-hide');
					if (scope.exploreWhenVisible === true) {
						controller.exploreFileSystem();
					}
				} else {
					jqElement[0].classList.add('ng-hide');
				}
			});
		}
	}
}).
directive('exploreWhenVisible', function() {
	return {
		restrict: 'A',
		require: 'fileExplorer',
		link: function(scope, element, attr, controller) {
			scope.$watch(attr.exploreWhenVisible, function (newValue, oldValue){
				scope.exploreWhenVisible = newValue;
			});
		}
	}
}).
directive('selectedFiles', function() {
	return {
		restrict: 'A',
		require: 'fileExplorer',
		link: function(scope, element, attr, controller) {
			controller
				.observeSelectedFiles()
				.do(function(selectedFiles) {
					scope[attr.selectedFiles] = selectedFiles;
				})
				.silentSubscribe();
		}
	}
});
//.directive('filterFiles', function() {
//	return {
//		restrict: 'A',
//		require: 'fileExplorer',
//		link: function(scope, element, attr, controller) {
//			scope.$watch(attr.filterFiles, function (newValue, oldValue){
//				controller.updateScope('filterFiles', newValue || 'm3u');
//			});
//		}
//	}
//})
