'use strict';

jpoApp.directive("fileExplorer", function ($window) {
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
		controller: function($scope, $rootScope, fileExplorerService) {

			$scope.$watch('mediaQueue.length', function(newValue) {
				if (newValue) {
					$scope.mediaQueueLength = newValue.length;
				} else {
					$scope.mediaQueueLength = 0;
				}
			});


			// TODO Should be put as constant in class
			var rootPath = '/',
				pathSeparator = '/',
				SINGLE = 'single',
				GROUPED = 'grouped',
				KEEP_EACH = 'keepeach';

			var _lastSelectedFile,
				_fileTree = [];

			$rootScope.$on('exploreFileSystem', function(event) {
				event.stopPropagation();
				// Auto start
				$scope.exploreFileSystem();
			});

			//$scope.selectedMediaUrl = null;
			$scope.selectedFiles = [];
			$scope.files = [];

			$scope.$watch("desiredFolderPath", function(newValue, oldValue) {
				if (newValue) { //&& newValue !== oldValue
					loadAndUpdateCurrentWorkingDir(newValue, null);
				}
			});

			$scope.goUp = function() {
				var upPath = generateUpDirPath();
				fileExplorerService
					.exploreFolder(upPath)
					.then(function (files) {
						setCurrentWorkingDirUp();
						setCurrentFolderFiles(files);
					}, function (err) {
					}
				);
			};

			$scope.innerPlayMedia = function(file) {
				$scope.playMedia({ file: file });
			};

			$scope.innerEnqueueMedia = function(file) {
				$scope.enqueueMedia({ file: file });
			};

			// To start file exploration.
			$scope.exploreFileSystem = function() { // TODO Here may be filePath for start (ex. favorite)
				loadAndUpdateCurrentWorkingDir(rootPath, rootPath);
			};

// BEGIN File selection system

			$scope.fileSelected = function(file) {
				var isFolder = file.type === 'D';
				if (isFolder) {
					var newPath = generatePathToDir(file.name);
					loadAndUpdateCurrentWorkingDir(newPath, file.name);
					// Reload folder mean we'll lose last file
					_lastSelectedFile = null;
				} else {
					updateFileSelection(file);
				}
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

			var loadAndUpdateCurrentWorkingDir = function(dirPath, folderName) { // TODO ugly
				fileExplorerService
					.exploreFolder(dirPath)
					.then(function (files) {
						// TODO To Builder To VM -> To entity/data
						_.each(files, function(file) {
							buildViewModel(file);
						});

						if (!folderName) {
							var __ = dirPath.split('/');
							var rest = _.rest(__, 1);
							var last = _.first(rest, rest.length-1);
							var folderNameFromDirPath = pathSeparator + last.join(pathSeparator) + pathSeparator;

							//var folderNameFromDirPath = dirPath.substr(dirPath.lastIndexOf(pathSeparator));
							setCurrentWorkingDir(folderNameFromDirPath);
						} else {
							setCurrentWorkingDir(folderName);
						}

						setCurrentFolderFiles(files);
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
				$scope.currentDirPath = getCurrentDirPath();
				//$scope.folderTree = _fileTree;
			};

			var setCurrentWorkingDirUp = function () {
				exitingFolder();
				$scope.currentDirPath = getCurrentDirPath();
				//$scope.folderTree = _fileTree;
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

			var generatePathToDir = function (mediaPath) {
				if (mediaPath === rootPath) {
					return rootPath;
				}
				// Root will be added by join anyway.
				var noRootDirPath = _.rest(_fileTree, 1);
				var noRootDirPathLength = noRootDirPath.length;
				if (noRootDirPathLength === 1) {
					return pathSeparator + noRootDirPath[0] + pathSeparator + mediaPath + pathSeparator;
				} else if (noRootDirPathLength > 1) {
					return pathSeparator + noRootDirPath.join(pathSeparator) + pathSeparator + mediaPath + pathSeparator;
				} else {
					return pathSeparator + mediaPath + pathSeparator;
				}
			};

			var generateUpDirPath = function() {
				var noRootDirPath = _.rest(_fileTree, 1);
				if (noRootDirPath.length === 1) {
					return rootPath;
				} else {
					var upDirPath = _.first(noRootDirPath, noRootDirPath.length - 1);
					return pathSeparator + upDirPath.join(pathSeparator) + pathSeparator;
				}
			};

			var getCurrentDirPath = function () {
				var noRootDirPath = _.rest(_fileTree, 1);
				if (noRootDirPath.length === 1) {
					return pathSeparator + noRootDirPath[0] + pathSeparator;
				} else {
					return pathSeparator + noRootDirPath.join(pathSeparator) + '/';
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
});