'use strict';

jpoApp
	.directive("fileExplorer", function () {
		return {
			restrict: 'E', // To be used as element (HTML tag)
			templateUrl: '/templates/controls/fileExplorer.html',
			scope: {
				currentDirPath: '=folderPath', // (Start folder ?) Means looks for folder-path attribute (= for object, & for function in parent scope, @ for just string or computed like {{}})
				desiredFolderPath: '=',
				//folderTree: '=',
				//playMedia: '&',
				selectedFiles: '='
			},
			controller: function($scope, $rootScope, fileExplorerService) {

				// Commands
				//var _playMediaCmd = $scope.playMedia;

				// Properties
	//			$scope.selectedMedia = null;
	//			$scope.selectedMediaFiles = [];
	//			$scope.currentFileExplorerDirPath = '';
	//			$scope.selectedFile = null;
				$scope.selectedMediaUrl = null;
				$scope.selectedFiles = [];
				$scope.files = [];

				var _fileTree = [];
				// TODO Should be put as constant in class
				var rootPath = '/';
				var pathSeparator = '/';

				//var _selfTriggeredCurrentDirPathChange;

//				$scope.mediaSelected = function(selectedMedia) {
	//				$scope.selectedMedia = selectedMedia;
//					$scope.selectedMediaUrl = getCurrentDirPath() + selectedMedia;
	//				$scope.selectedMediaUrl = mediaUrlPattern
	//					.replace(':id', selectedMedia._id)
	//					.replace(':ext', selectedMedia.ext);
//				};

				//$rootScope.$on('mediaEnded', function(event, args) {
					// search
				//});

				$scope.$watch("desiredFolderPath", function(newValue, oldValue) {
					if (newValue !== null && newValue !== oldValue) {
						loadAndUpdateCurrentWorkingDir(newValue, null);
					}
				});
//				$scope.setCurrentDirPath = function(dirPath) {
//					loadAndUpdateCurrentWorkingDir(dirPath);
//				};

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

				$scope.fileValidated = function(file) {
					var isFolder = file.type === 'D';
					if (isFolder) {
						var newPath = generatePathToDir(file.name);
						loadAndUpdateCurrentWorkingDir(newPath, file.name);
					} else {
						var selectedMediaUrl = $scope.currentDirPath + file.name;
						$scope.selectedMediaUrl = selectedMediaUrl;

						$rootScope.$emit('playMedia', selectedMediaUrl);
//						if (!$scope.playMedia) {
//							throw "playMedia attribute must be set";
//						}
//						$scope.playMedia(selectedMediaUrl);
					}
				};

				// To start file exploration.
				$scope.exploreFileSystem = function() { // TODO Here may be filePath for start (ex. favorite)
//					fileExplorerService
//						.exploreFolder(rootPath)
//						.then(function (files) {
//							setCurrentWorkingDir(rootPath);
//							setCurrentFolderFiles(files);
//						}, function (err) {
//						});
					loadAndUpdateCurrentWorkingDir(rootPath, rootPath);
				};

				$scope.fileSelected = function(file) {
					// Toggle selection.
					file.selected = !file.selected;

					updateSelectedFiles();
				};

				var updateSelectedFiles = function () {
					var files = $scope.files;
					$scope.selectedFiles = _.filter(files, function(file) {
						return file.selected;
					});
				};

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

				// Auto start
				$scope.exploreFileSystem();
			}
		};
	});