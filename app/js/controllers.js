'use strict';

angular.module('jpoApp.controllers', []).
	controller('mainCtrl', ['$scope', 'favoriteBusiness', 'playlistService', function($scope, favoriteBusiness, playlistService) {




		//$scope.currentDirPath = '';
		$scope.currentFileExplorerDirPath = '';
		$scope.explorerSelectedFiles = null;
		$scope.currentFileExplorerDirTree = null;
//		$scope.breadCrumbDirPath = '';
		$scope.selectedMediaUrl = null;
		$scope.selectedPlaylist = null;
		$scope.canUseAddToPlaylist = true;

		// BEGIN Favorites section

		$scope.favorites = null;

		$scope.pageTitle = 'JogPlayer Online';
		$scope.displayMediaInTitle = function(mediaTitle) {
			if (!mediaTitle) {
				$scope.pageTitle = 'JogPlayer Online';
			} else {
				$scope.pageTitle = mediaTitle + " - JogPlayer Online";
			}
		};

		$scope.addFolderToFavoritesCmd = function() {
			// Get folder name for fav name.
			var folderPath = $scope.currentFileExplorerDirPath; // TODO Current folder path instead
			favoriteBusiness.addFolderToFavoritesAsync(folderPath);
		};

		// END Favorites section

		// BEGIN Queue section

		var _currentPlayingMedia = null;
		$scope.selectedFiles = [];
		$scope.selectedMedia = [];
		$scope.mediaQueue = [];
		$scope.currentMediaInQueue = null;
		$scope.currentMediaIndexInQueue = null;
		$scope.currentPlaylist = null;

		$scope.addFilesToPlaylist = function() {
			//$scope.$emit('addFilesToPlaylist', $scope.selectedFiles);
			if (!$scope.selectedPlaylist) {
				return;
			}

			var mediaFilePaths = _.map($scope.selectedFiles, function(file) {
				return selectSelfPhysicalFromLinks(file.links);
			});

			playlistService
				.addMediaByFilePathToPlaylist($scope.selectedPlaylist, mediaFilePaths)
				.then(function(res) {
					$scope.$emit('playlist.mediaInserted', res);
				});
		};

		$scope.clearQueue = function() {
			$scope.$emit('stopMedia');
			$scope.currentMediaInQueue = null;
			$scope.currentMediaIndexInQueue = -1;
			$scope.mediaQueue = [];
		};

		$scope.enqueueMediaSelection = function () {
			var clonedMedia = _.map($scope.selectedMedia, function(media) {
				return _.clone(media);
			});
			$scope.mediaQueue = $scope.mediaQueue.concat(clonedMedia);
		};

		$scope.enqueueFileSelection = function () {
			var filesInSelection = _.filter($scope.selectedFiles, function(file) {
				return file.type === 'F';
			});
			var clonedFiles = _.map(filesInSelection, function(media) {
				return _.clone(media);
			});
			$scope.mediaQueue = $scope.mediaQueue.concat(clonedFiles);
		};

		$scope.enqueueMediaFromFileExplorer = function (media) {
			var clonedMedia = _.clone(media);
			$scope.mediaQueue = $scope.mediaQueue.concat(clonedMedia);
		};

		/*
			Called when user clicks a media from the queue
		*/
		$scope.playMediaFromQueue = function(media) {
			// Enqueue and play.
			if ($scope.mediaQueue.length > 0) {
				$scope.$emit('playMedia', media);
				// Set state: change current media
				$scope.currentMediaInQueue = media;
				$scope.currentMediaIndexInQueue = _.indexOf($scope.mediaQueue, media);
				setCurrentMediaState(media);
			} else { // Enqueue but wait.
				var clonedFile = _.clone(media);
				$scope.mediaQueue = $scope.mediaQueue.concat(clonedFile);
			}
		};

		$scope.removeFromQueue = function(media) {
			if ($scope.currentMediaInQueue && $scope.currentMediaInQueue === media) {
				$scope.$emit('stopMedia');
				$scope.currentMediaInQueue = null;
				$scope.currentMediaIndexInQueue = -1;
			} else {
				var mediaToRemoveIndex = _.indexOf($scope.mediaQueue, media);
				if (mediaToRemoveIndex < $scope.currentMediaIndexInQueue) {
					$scope.currentMediaIndexInQueue--;
				}
			}

			$scope.mediaQueue =_.filter($scope.mediaQueue, function(mediaInQueue) {
				return mediaInQueue !== media;
			});
		};

		// END Queue section

		// BEGIN Play media

		$scope.playCurrentMediaError = function() {
			// Notify error playing and try next.
			$scope.$apply(function () {
				$scope.currentMediaInQueue.hasError = true;
			});
			playNext();
		};

		$scope.playRequest = function() {
			// Get media to play from queue. If so, then set as current, emit playMedia
			var mediaQueue = $scope.mediaQueue;
			if (mediaQueue.length === 0) {
				return;
			}
			var media = mediaQueue[0];

			$scope.$emit('playMedia', media);
			// Set state: change current media
			$scope.currentMediaInQueue = media;
			$scope.currentMediaIndexInQueue = 0;
			setCurrentMediaState(media);
		};

		$scope.playMediaFromFileExplorer = function(media) {
			$scope.mediaQueue = $scope.mediaQueue.concat(media);
			$scope.$emit('playMedia', media);
			// Set state: change current media
			$scope.currentMediaInQueue = media;
			$scope.currentMediaIndexInQueue = _.indexOf($scope.mediaQueue, media);
			setCurrentMediaState(media);
		};

		// Command being called when media play ends
		$scope.mediaEnded = function() {
			playNext();
		};

		$scope.playNext = function() {
			playNext();
		};

		$scope.playPrevious = function() {
			playPrevious();
		};

		//$scope.exploreFileSystem = function() {
		//	$scope.$emit('exploreFileSystem');
		//};

		// BEGIN Playlist section

		$scope.playMediaFromPlaylist = function(media, srcPlaylist) {

			var isCurrentMediumFromPlaylist = $scope.currentMediaInQueue && angular.isDefined($scope.currentMediaInQueue._id);
			if (isCurrentMediumFromPlaylist) {
				// ne marchera pas car clone
				//$scope.currentMediaInQueue.isPlaying = false;
				if (_currentPlayingMedia) {
					_currentPlayingMedia.isPlaying = false;
					media.isPlaying = true;
				}
			}

			$scope.currentPlaylist = srcPlaylist;
			$scope.mediaQueue = $scope.mediaQueue.concat(media);
			//$scope.$apply();

			$scope.$emit('playMedia', media);
			// Set state: change current media
			$scope.currentMediaInQueue = media;
			$scope.currentMediaIndexInQueue = _.indexOf($scope.mediaQueue, media);
			setCurrentMediaState(media);

			_currentPlayingMedia = media;
		};

		// END Playlist section

		var playNext = function() {
			// si media de playlist, demander next pl, puis play
			var isMediumFromPlaylist = _currentPlayingMedia && angular.isDefined(_currentPlayingMedia._id);
			// TODO This is bad if we're changing current playing media to an old one, that will fail
			var isLastElement = $scope.currentMediaIndexInQueue === $scope.mediaQueue.length - 1;
			if (isMediumFromPlaylist && isLastElement) {
				var currentMediumIndex = _currentPlayingMedia.index;
				_currentPlayingMedia.isPlaying = false;
				if (currentMediumIndex <= $scope.currentPlaylist.media.length - 1) {
					// take next
					var nextMedium = $scope.currentPlaylist.media[currentMediumIndex+1];
					nextMedium.isPlaying = true;
					_currentPlayingMedia = nextMedium;
					// add to queue
					var clonedMedia = _.clone(nextMedium);
					$scope.mediaQueue = $scope.mediaQueue.concat(clonedMedia);
					//$scope.$apply();
					// play it
					$scope.currentMediaInQueue = clonedMedia;
					$scope.currentMediaIndexInQueue = clonedMedia.index;

					$scope.$emit('playMedia', nextMedium);
					setCurrentMediaState(nextMedium);
				}

			} else {
				// Check for next media in queue
				var currentMediaPos = $scope.currentMediaIndexInQueue;
				var isLastMediaInQueue = currentMediaPos >= $scope.mediaQueue.length-1;
				if (isLastMediaInQueue) {
					return;
				}

				var nextMediaIndex = currentMediaPos+1;
				var nextMediaInQueue = $scope.mediaQueue[nextMediaIndex];
				$scope.currentMediaInQueue = nextMediaInQueue;
				$scope.currentMediaIndexInQueue = nextMediaIndex;
				$scope.$emit('playMedia', nextMediaInQueue);
				setCurrentMediaState(nextMediaInQueue);
			}

			// si media de fileExplorer, ne pas prendre le suivant de pl

		};

		var selectSelfPhysicalFromLinks = function(links) {
			var link = _.find(links, function(link) {
				return link.rel === 'self.phys';
			});
			if (link) {
				return link.href;
			}
		};

		$scope.changeDirByPhysPathCmd = function(physPath){
			$scope.$emit('changeDirectoryByPhysPath', physPath);
		};

		//$scope.changeDirByLinkCmd = function(link){
		//	$scope.$emit('changeDirectoryByLink', link);
		//};

		$scope.playFolder = function(folderPath) {

			// Start play folder mode




		};

		var playPrevious = function() {
			// Check for previous media in queue
			var currentMediaPos = $scope.currentMediaIndexInQueue;
			var isFirstMediaInQueue = currentMediaPos <= 0;
			if (isFirstMediaInQueue) {
				return;
			}

			var previousMediaIndex = currentMediaPos-1;
			var previousMediaInQueue = $scope.mediaQueue[previousMediaIndex];
			$scope.currentMediaInQueue = previousMediaInQueue;
			$scope.currentMediaIndexInQueue = previousMediaIndex;
			$scope.$emit('playMedia', previousMediaInQueue);
			setCurrentMediaState(previousMediaInQueue);
		};

		var setCurrentMediaState = function(media) {
			$scope.currentMediaInQueue.hasError = false;
		};

		// END Play media

	}]);