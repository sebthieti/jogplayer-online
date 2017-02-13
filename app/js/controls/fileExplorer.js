'use strict';

jpoApp.directive("fileExplorer", function ($window, $http, fileExplorerService, jpoProxy) {
	return {
		restrict: 'E', // To be used as element (HTML tag)
		templateUrl: '/templates/controls/fileExplorer.html',
		scope: {
			currentDirPath: '=folderPath', // (Start folder ?) Means looks for folder-path attribute (= for object, & for function in parent scope, @ for just string or computed like {{}})
			desiredFolderPath: '=',
			playMedia: '&',
			enqueueMedia: '&',
			selectedFiles: '=',
			keyDown: '&',
			selectionMode: '=',
			mediaQueue: '='
		},
		controller: function($scope, $rootScope) {

			var currentFolder;

			// canExecuteFolderUp true when user initiate component which load file tree
			$scope.canExecuteFolderUp = false;
			$scope.isActive = false;

			//$scope.isVisible = true;
			//$scope.exploreWhenVisible = false;

			$scope.$watch('mediaQueue.length', function(newValue) {
				if (newValue) {
					$scope.mediaQueueLength = newValue.length;
				} else {
					$scope.mediaQueueLength = 0;
				}
			});

			this.setBehaviors = function() {

			}

			//$scope.$watch("isVisible", function(isVisible, oldValue) {
			//	if ($scope.isVisible && $scope.isVisible == true && $scope.exploreWhenVisible && $scope.exploreWhenVisible == true) {
			//		if (!currentFolder) {
			//			startExplore();
			//		}
			//	}
			//});

			// TODO Should be put as constant in class
			var rootPath = '/',
				pathSeparator = '/',
				SINGLE = 'single',
				GROUPED = 'grouped',
				KEEP_EACH = 'keepeach';

			var _lastSelectedFile,
				_fileTree = [];


			$scope.selectedFiles = [];
			$scope.files = [];

			//changeDirectory
			$rootScope.$on('changeDirectoryByPhysPath', function(event, physPath) {
				event.stopPropagation();
				changeWorkingDirByPath(physPath, null);
			});

			$rootScope.$on('changeDirectoryByLink', function(event, link) {
				event.stopPropagation();
				changeWorkingDirByLink(link, null);
			});
			var filterFiles = function (files, filterFiles) {
				return _.filter(files, function(file) {
					return file.type === 'D' || file.name.endsWith(filterFiles); // TODO Should handle multi ext.
				});
			};
			$scope.goUp = function() {
				var upPath = selectParentDirFromLinks(currentFolder.links);
				$http.get(upPath)
					.then(function(result) {
						currentFolder = result.data;
						var files = filterFiles(result.data.files, $scope.filterFiles);

							//var files = currentFolder.files;
						// TODO To Builder To VM -> To entity/data
						_.each(files, function(file) {
							buildViewModel(file);
						});

						setCurrentWorkingDirUp();
						setCurrentFolderFiles(files);

						var parentDirPath = selectParentDirFromLinks(currentFolder.links); // TODO Should be an object's method
						var currentDirPath = selectSelfPhysicalFromLinks(currentFolder.links);// TODO Should be an object's method
						$scope.currentDirPath = currentDirPath;
						$scope.canExecuteFolderUp = angular.isDefined(parentDirPath); // TODO weird code because of path bug
					});
			};

			var selectParentDirFromLinks = function(links) {
				var link = _.find(links, function(link) {
					return link.rel === 'parent';
				});
				if (link) {
					return link.href;
				}
			};

			var selectSelfFromLinks = function(links) {
				return _.find(links, function(link) {
					return link.rel === 'self';
				}).href;
			};

			var selectSelfPhysicalFromLinks = function(links) {
				var link = _.find(links, function(link) {
					return link.rel === 'self.phys';
				});
				if (link) {
					return link.href;
				}
			};

			$scope.innerPlayMedia = function(file) {
				if ($scope.mediaQueueLength === 0) {
					$scope.playMedia({ file: file });
				} else {
					$scope.enqueueMedia({ file: file });
				}
			};

			this.exploreFileSystem = function() {
				startExplore();
			};

			this.updateScope = function(key, value) {
				$scope[key] = value;
			};

			// To start file exploration.
			$scope.exploreFileSystem = function() { // TODO Here may be filePath for start (ex. favorite)
				startExplore();
			};

// BEGIN File selection system

			$scope.fileSelected = function(file) {
				var isFolder = file.type === 'D';
				if (isFolder) {
					var dirPath = selectSelfFromLinks(file.links);
					$http.get(dirPath)
						.then(function(result) {
							currentFolder = result.data;
							var files = filterFiles(currentFolder.files, $scope.filterFiles);

							// TODO To Builder To VM -> To entity/data
							_.each(files, function(file) {
								buildViewModel(file);
							});

							var parentDirPath = selectParentDirFromLinks(currentFolder.links); // TODO Should be an object's method
							var currentPhysicalDirPath = selectSelfPhysicalFromLinks(currentFolder.links); // TODO Should be an object's method

							setCurrentWorkingDir(currentPhysicalDirPath);
							setCurrentFolderFiles(files);

							$scope.canExecuteFolderUp = angular.isDefined(parentDirPath); // TODO weird code because of path bug
							$scope.isActive = true;
						});

					// Reload folder mean we'll lose last file
					_lastSelectedFile = null;
				} else {
					updateFileSelection(file);
				}
			};

			$scope.isDirectory = function(file) {
				return file.type === 'D'
			};

			$scope.isFile = function(file) {
				return file.type === 'F'
			};

			var updateFileSelection = function (file) {
				// Change selection accordingly to current selection mode.
				switch($scope.selectionMode) {
					case SINGLE:
						singleMediaSelection(file);
						break;
					case KEEP_EACH:
						multipleMediaSelection(file);
						break;
					case GROUPED:
						inlineMediaSelection(file);
						break;
				}
				_lastSelectedFile = file;
			};

			var singleMediaSelection = function (file) {
				// Un-select all media.
				_.each($scope.files, function (file) {
					file.selected = false;
				});

				// Toggle selection for selected file.
				file.selected = !file.selected;

				// Finally update selected files
				updateSelectedFiles();
			};

			var multipleMediaSelection = function (file) {
				// Toggle selection for selected file.
				file.selected = !file.selected;

				// Finally update selected files
				updateSelectedFiles();
			};

			var inlineMediaSelection = function (file) {
				var files = $scope.files;
				var fileIndex = _.indexOf(files, file);
				var startIndex, endIndex;

				// If one file has been selected before, use it as the first to select.
				// So, set startIndex and endIndex to properly select media
				if (_lastSelectedFile) {
					// Un-select all media
					_.each($scope.files, function (file) {
						file.selected = false;
					});

					// Select from previous last selected file to selected file
					var lastSelectedFileIndex = _.indexOf(files, _lastSelectedFile);

					startIndex = Math.min(lastSelectedFileIndex, fileIndex);
					endIndex = Math.max(lastSelectedFileIndex, fileIndex);
				} else {
					startIndex = 0;
					endIndex = fileIndex;
				}

				// Select files.
				for(var index = startIndex; index < endIndex; index++) {
					files[index].selected = true;
				}

				// Finally update selected files
				updateSelectedFiles();
			};

			var updateSelectedFiles = function () {
				$scope.selectedFiles = _.filter($scope.files, function(file) {
					return file.selected;
				});
			};

// END File selection system
			var startExplore = function(){
				fileExplorerService
					.startExplore()
					.then(function(filesResult) {
						currentFolder = filesResult;
						var files = filterFiles(currentFolder.files, $scope.filterFiles);
						// TODO To Builder To VM -> To entity/data
						_.each(files, function(file) {
							buildViewModel(file);
						});

						$scope.currentDirPath = '/';
						setCurrentFolderFiles(files);

						$scope.isActive = true;
					});
			};

			var changeWorkingDirByPath = function(physPath) {
				fileExplorerService
					.exploreFolder(physPath)
					.then(function (result) {
						currentFolder = result.data;
						var files = filterFiles(currentFolder.files, $scope.filterFiles);
						// TODO To Builder To VM -> To entity/data
						_.each(files, function(file) {
							buildViewModel(file);
						});

						setCurrentFolderFiles(files);
						var currentDirPath = selectSelfPhysicalFromLinks(currentFolder.links);
						$scope.currentDirPath = currentDirPath;
						var parentDirPath = selectParentDirFromLinks(currentFolder.links);
						$scope.canExecuteFolderUp = angular.isDefined(parentDirPath); // TODO weird code because of path bug
						$scope.isActive = true;
					}, function (err) {
					});
			};

			var changeWorkingDirByLink = function(link) { // dirPath, folderName // TODO ugly
				var targetLink = link.href;

				$http.get(targetLink)
					.then(function (result) {
						currentFolder = result.data;
						var files = filterFiles(currentFolder.files, $scope.filterFiles);
						// TODO To Builder To VM -> To entity/data
						_.each(files, function(file) {
							buildViewModel(file);
						});

						setCurrentFolderFiles(files);
						var currentDirPath = selectSelfPhysicalFromLinks(currentFolder.links);
						$scope.currentDirPath = currentDirPath;
						var parentDirPath = selectParentDirFromLinks(currentFolder.links);
						$scope.canExecuteFolderUp = angular.isDefined(parentDirPath); // TODO weird code because of path bug
						$scope.isActive = true;
					}, function (err) {
					});
			};

			var setCurrentWorkingDir = function (folderNameOrPath) {
				// TODO Following statement To method
				if (folderNameOrPath !== rootPath && folderNameOrPath.indexOf(pathSeparator) !== -1) {
					// REDO TREE
					_fileTree = [];
					_.each(folderNameOrPath.split(pathSeparator), function (folderName) {
						enteringFolder(folderName);
					});
				} else { // No path, just one dir
					enteringFolder(folderNameOrPath);
				}
				setCurrentDirPath(getCurrentDirPath());
			};

			var setCurrentWorkingDirUp = function () {
				exitingFolder();
				setCurrentDirPath(getCurrentDirPath());
			};

			var setCurrentDirPath = function(dirPath){
				$scope.currentDirPath = dirPath;
			};

			var enteringFolder = function (folderName) {
				_fileTree.push(folderName);
			};

			var exitingFolder = function () {
				_fileTree.pop();
			};

			var buildViewModel = function (file) {
				file.selected = false;
				file.hasError = false;
			};

			var setCurrentFolderFiles = function (files) {
				$scope.files = files;
			};

			var getCurrentDirPath = function () {
				var noRootDirPath = _.rest(_fileTree, 1);
				if (noRootDirPath.length === 1) {
					return pathSeparator + noRootDirPath[0] + pathSeparator;
				} else {
					var path = pathSeparator + _.filter(noRootDirPath, function(dir) {return dir != ''}).join(pathSeparator);
					if (!path.endsWith('/')) {
						path += '/';
					}
					return path;
				}
			};
		},
		link: function(scope) {
			var SINGLE = 'single',
				GROUPED = 'grouped',
				KEEP_EACH = 'keepeach';

			var CTRL_KEYCODE = 17,
				SHIFT_KEYCODE = 16;

			var _defaultMode = SINGLE,
				_currentMode = _defaultMode;

			$window.addEventListener('keydown', function (event) {
				var lastMode = _currentMode;
				switch (event.keyCode) {
					case CTRL_KEYCODE:
						_currentMode = KEEP_EACH;
						break;
					case SHIFT_KEYCODE:
						_currentMode = GROUPED;
						break;
					default:
						_currentMode = _defaultMode;
						break;
				}

				if (_currentMode !== lastMode) {
					updateSelectionMode(_currentMode);
				}
			});

			$window.addEventListener('keyup', function () {
				if (_currentMode === _defaultMode) {
					return;
				}
				_currentMode = _defaultMode;
				updateSelectionMode(_currentMode);
			});

			var updateSelectionMode = function(mode) {
				scope.selectionMode = mode;
			};

			updateSelectionMode(_currentMode);
		}
	};
}).directive('isVisible', function() {
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
}).directive('exploreWhenVisible', function() {
	return {
		restrict: 'A',
		require: 'fileExplorer',
		link: function(scope, element, attr, controller) {
			scope.$watch(attr.exploreWhenVisible, function (newValue, oldValue){
				scope.exploreWhenVisible = newValue;
			});
		}
	}
}).directive('filterFiles', function() {
	return {
		restrict: 'A',
		require: 'fileExplorer',
		link: function(scope, element, attr, controller) {
			scope.$watch(attr.filterFiles, function (newValue, oldValue){
				controller.updateScope('filterFiles', newValue || 'm3u');
			});
		}
	}
});