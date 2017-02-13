'use strict';

jpoApp.directive("breadCrumb", [
	'breadCrumbPlaylistExplorerBusiness',
	'breadCrumbFileExplorerBusiness',
	function (breadCrumbPlaylistExplorerBusiness, breadCrumbFileExplorerBusiness) {

	var linkHelpers = Helpers.linkHelpers;
	return {
		restrict: 'E',
		templateUrl: '/templates/controls/breadCrumb.html',
		scope: { groupName: '@' },
		controller: function($scope) {
			var emptyArray = [];
			var rootPath = '/';
			var _folderPath;
			var breadCrumbBusiness = null;

			if ($scope.groupName === 'file-explorer') {
				breadCrumbBusiness = breadCrumbFileExplorerBusiness;
			} else if ($scope.groupName === 'playlist-finder') {
				breadCrumbBusiness = breadCrumbPlaylistExplorerBusiness;
			} else {
				throw 'Must set groupName';
			}

			$scope.levels = emptyArray;

			$scope.goToLevel = function(index) {
				var folderPath = composePathToLevelIndex(index);
				breadCrumbBusiness.changeDir(folderPath);
			};

			$scope.canShowPlayFolder = function(level) {
				// Only allow to play last folder in tree
				return level.index === $scope.levels.length-1;
			};

			$scope.innerPlayFolder = function (level) {
				level.playHole = !level.playHole;
			};

			var composePathToLevelIndex = function(index) {
				var levels = splitFolderPath(_folderPath);
				var path = '';
				for (var currentLevel = 0; currentLevel <= index; currentLevel++) {
					path += levels[currentLevel];
					if (currentLevel > 0) {// TODO Revamp with join
						path += '/';
					}
				}
				return path;
			};

			var parseFolderPath = function(folderPath) {
				if (!folderPath) {
					return emptyArray;
				}

				return splitFolderPath(folderPath)
					.map(function(lvl, index) {
						return { name: lvl, index: index }
					});
			};

			var splitFolderPath = function(folderPath) {
				if (folderPath === rootPath) {
					return [ rootPath ];
				}
				var levels = folderPath.split("/");
				levels[0] = rootPath; // TODO Ugly
				return _.filter(
					levels,
					function(lvl) {
						return lvl !== ''
					});
			};

			breadCrumbBusiness
				.observeCurrentDir()
				.do(function (folderLinks) {
					var dirPhysPath = linkHelpers.selectSelfPhysicalFromLinks(folderLinks);
					_folderPath = dirPhysPath;
					$scope.levels = parseFolderPath(dirPhysPath);
				})
				.subscribe(
					function(_) {},
					function(err) { console.log(err) }
				);
		}
	};
}]);