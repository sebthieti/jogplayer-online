'use strict';

angular.module('jpoApp.controllers', []).
	controller('mainCtrl', ['$scope', '$window', '$http',
		function($scope, $window, $http) {

			$scope.mediaQueue = [];
			//$scope.selectedMediaFiles = [];
			$scope.selectedFileName = '';
			$scope.selectedFile = {};
			$scope.selectedFiles = [];
            $scope.currentBtnUrl = "svg/play.svg";
			$scope.files = [];
			$scope.currentDirPath = '';
			$scope.currentFileExplorerDirPath = '';
			$scope.explorerSelectedFiles = null;
			$scope.currentFileExplorerDirTree = null;
			$scope.breadCrumbDirPath = '';

			//$scope.playMedia = null;
			//$scope.playMediaToCtrl = null;
			$scope.selectedMediaUrl = null;


//            var audioPlayer = window.document.getElementById("audioPlayer");

//            audioPlayer.onprogress = function (_, __) {
//                console.log(audioPlayer.buffered);
//            };
//			audioPlayer.addEventListener(
//				"progress",
//				function (_, __) {
//					console.log(audioPlayer.buffered);
//				},
//				true
//			);


//			audioPlayer.addEventListener("ended",
//				function () {
//					// Play next
//					playNext();
//				}, true
//			);


            var playingState = "stopped";
            var playlistsUrl = "/api/playlists/";
			var mediaUrlPattern = "/api/medias/play/:id:ext";
			var mediaPlayByPathPattern = "/api/medias/play/byPath/:mediaPath";
			var explorerPathPattern = "/api/explore/:path";
			//var currentDirPath = '';
			var currentFileExplorerFilePath = '';

			var playNext = function () {
				// Select next media.
				// Put Url to audio tag
				// Do play
			};

//			$scope.$watch('breadCrumbDirPath', function() {
//				var selectedFiles = $scope.explorerSelectedFiles;
//				//alert('hey, myVar has changed!');
//			});


//			$scope.onChangeFileExplorerCurrentDir = null;

//			$scope.changeFileExplorerCurrentDir = function(dirPath) {
//				$scope.onChangeFileExplorerCurrentDir(dirPath);
//			};

			$scope.selectedFile = function(file) {

			};

			$scope.selectedFiles = function(files) {

			};

			$scope.addToPlaylist = function() {

			};

			$scope.playlistSelected = function(selectedPlaylist) {
				$scope.selectedPlaylist = selectedPlaylist;

				$http.get(playlistsUrl + selectedPlaylist._id)
					.then(function (result) {
						$scope.medias = result.data;
					}, function (err) {
					});
			};

			$scope.mediaSelected = function(selectedMediaUrl) {
				$scope.selectedMediaUrl = selectedMediaUrl;
				$scope.selectedMediaUrl = mediaUrlPattern
					.replace(':id', selectedMediaUrl._id)
					.replace(':ext', selectedMediaUrl.ext);
			};

			$scope.goUp = function() {
				var currentLevelNoLastSlash = $scope.currentDirPath.substring(0, $scope.currentDirPath.length-2);
				var upOneLevel = currentLevelNoLastSlash.substring(0, currentLevelNoLastSlash.lastIndexOf('/')+1);
				$http.get(upOneLevel)
					.then(function (result) {
						$scope.currentDirPath = upOneLevel;
						$scope.files = result.data;
					}, function (err) {
					}
				);
			};

			$scope.enqueueSelection = function () {
				var files = $scope.files;
				for (var selectionIndex = 0; selectionIndex < $scope.files.length; selectionIndex++) {
					var file = files[selectionIndex];
					if (!file.selected) {
						continue;
					}
					$scope.mediaQueue.push({
						name: file.name,
						path: $scope.currentDirPath + file.name
					});
				}
				//$scope.mediaQueue.push( {name: '', path: ''} );
			};

			$scope.fileSelected = function(file) {
				$scope.selectedFileName = file.name;
				$scope.selectedFile = file;
				$scope.selectedFile.selected = !$scope.selectedFile.selected;
			};

//			$scope.fileValidated = function(file) {
//				if (file.type == 'D') {
//					$scope.selectedFileName = null;
//					$scope.selectedFile = null;
//					var pathUrl = $scope.currentDirPath + file.name + '/';
//					$http.get(pathUrl)
//						.then(function (result) {
//							$scope.currentDirPath = pathUrl;
//							$scope.files = result.data;
//							//Model.
//						}, function (err) {
//						}
//					);
//				} else {
//					currentFileExplorerFilePath = $scope.currentDirPath + file.name;
//					$scope.selectedFileName = file.name;
//					$scope.selectedFile = file;
//
//					$scope.selectedMediaUrl = currentFileExplorerFilePath;
//					$scope.playMedia();
//				}
//			};

//			$scope.playMedia = function(selectedMediaUrl) {
//				// TODO Following statement s/b removed afterwards
//				if (!$scope.selectedMediaUrl) {
//					return;
//				}
//
//				$scope.selectedMediaUrl = selectedMediaUrl;
//			};

//			$scope.playMedia = function(mediaUrl) {
//				$scope.playMediaToCtrl(mediaUrl)
//			};


//			$scope.playMedia = function(selectedMediaUrl) {
//				alert('will play');
//				if (playingState === "stopped") {
//					$scope.selectedMediaUrl = currentFileExplorerFilePath;
//					$scope.currentBtnUrl = "svg/pause.svg";
//
//					playingState = "playing";
//				} else if (playingState === "playing") {
//					audioPlayer.pause();
//					playingState = "paused";
//					$scope.currentBtnUrl    = "svg/play.svg";
//				} else if (playingState === "paused") {
//					audioPlayer.play();
//					playingState = "playing";
//					$scope.currentBtnUrl = "svg/pause.svg";
//				}
//			};

//			$scope.$watch('explorerSelectedFiles', function() {
//				var selectedFiles = $scope.explorerSelectedFiles;
//				//alert('hey, myVar has changed!');
//			});

//			$scope.$watch('currentFileExplorerDirTree', function() {
//				var dirTree = $scope.currentFileExplorerDirTree;
//				//alert('hey, myVar has changed!');
//			});

			$scope.addPlaylist = function() {

			};

			$scope.exploreFileSystem = function() {
				var pathUrl = explorerPathPattern.replace(':path', '');

				$http.get(pathUrl)
					.then(function (result) {
						$scope.currentDirPath = pathUrl;
						$scope.files = result.data;
					}, function (err) {
				});
			};

			$http.get(playlistsUrl)
				.then(function (result) {
					$scope.playlists = result.data;
				}, function (err) {
				});


//			$scope.playMedia = function() {
//				alert("you clicked playMedia!");
//			};

		}]).
	controller('fileExplorerCtrl', ['$scope', '$window', '$http',
		function($scope, $window, $http) {



		}]);