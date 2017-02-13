'use strict';

jpoApp.directive("fileExplorer", function ($window, $http, fileExplorerBusiness, fileExplorerService) {
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
			mediaQueue: '=',
			bindToFavorites: '='
		},
		controller: function($scope, $rootScope) {

			var self = this;
			var fileExplorerType = $scope.bindToFavorites
					? 'mediaExplorer'
					: 'fileSelector';
			// canExecuteFolderUp true when user initiate component which load file tree
			$scope.canExecuteFolderUp = false;
			$scope.isActive = false;

			$scope.$watch('mediaQueue.length', function(newValue) {
				if (newValue) {
					$scope.mediaQueueLength = newValue.length;
				} else {
					$scope.mediaQueueLength = 0;
				}
			});

			// TODO Don't remove until I care about import playlist
			$scope.$watch("isVisible", function(isVisible, oldValue) {
				if ($scope.isVisible &&
					$scope.isVisible == true &&
					$scope.exploreWhenVisible &&
					$scope.exploreWhenVisible == true) {
					//if (!currentFolder) {
						fileExplorerBusiness.startExplore(self);
					//}
				}
			});

			// TODO Should be put as constant in class
			var rootPath = '/',
				pathSeparator = '/',
				SINGLE = 'single',
				GROUPED = 'grouped',
				KEEP_EACH = 'keepeach';

			var _lastSelectedFile;

			$scope.selectedFiles = [];
			$scope.files = [];

			$scope.goUp = function() {
				fileExplorerBusiness.goUp($scope.links, fileExplorerType);
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
				fileExplorerBusiness.fileSelected(file, fileExplorerType);
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
				fileExplorerBusiness.startExplore(self);
			};

			// TODO Temporary check. Check with better code (observ. sn/b subsc. if fileExp is the left one (no favs))
			var observeExternalChanges = $scope.bindToFavorites;
			fileExplorerBusiness
				.observeCurrentFolderContent(observeExternalChanges, fileExplorerType, self)
				.do(function (filesViewModel) {
					$scope.files = filesViewModel.files;
					$scope.links = filesViewModel.links;
					$scope.isActive = filesViewModel.isActive;
					$scope.canExecuteFolderUp = filesViewModel.canExecuteFolderUp;
				})
				.subscribe( // TODO To SilentSubscribe ?
					function (_) {
					},
					function (err) {
						console.log(err)
					} // TODO console.log should disappear in prod.
				); // TODO Handle a disposeWith method
				// TODO Remember that a failed Observable will end, so find a way to let it alive
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