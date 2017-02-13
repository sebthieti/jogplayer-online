'use strict';

jpoApp.directive("audioPlayer", function () {
	return {
		restrict: 'E', // To be used as element (HTML tag)
		replace: true, // Replace HTML tag bread-crumb with template
		templateUrl: '/templates/controls/audioPlayer.html',
		scope: {
			mediaUrl: "=" // Means looks for folder-path attribute (= for object, & for function in parent scope, @ for just string or computed like {{}})
		},
		controller: function($scope, $rootScope, pathHelper) {

			var _audioPlayer;
			var _currentState = '';

			this.setAndInitAudioPlayer = function(audioPlayer) {
				_audioPlayer = audioPlayer;
				initAudioPlayer();
			};

			$scope.currentBtnUrl = "svg/play.svg";

			$scope.playOrPause = function() {
				playMedia(_audioPlayer.src);
			};

			$scope.playMedia = function(mediaUrl) {
				playMedia(mediaUrl);
			};

			$scope.playOrPause = function() {
				playOrPause();
			};

			var initAudioPlayer = function () {
				_audioPlayer.addEventListener("playing", mediaPlayingStatusChange, true);
				_audioPlayer.addEventListener("pause", mediaPauseStatusChange, true);
				_audioPlayer.addEventListener("ended", mediaEndedStatusChange, true);
			};

			var mediaEndedStatusChange = function () {
				$rootScope.$emit('mediaEnded');
			};

			var mediaPlayingStatusChange = function() {
				_currentState = 'playing';
				turnPlayButtonToPause();
			};

			var mediaPauseStatusChange = function() {
				_currentState = 'pause';
				turnPauseButtonToPlay();
			};

			var turnPlayButtonToPause = function () {
				$scope.currentBtnUrl = "svg/pause.svg";
				$scope.$apply();
			};

			var turnPauseButtonToPlay = function () {
				$scope.currentBtnUrl = "svg/play.svg";
				$scope.$apply();
			};

			var playOrPause = function() {
				switch (_currentState) {
					case 'ended':
					case 'pause':
						_audioPlayer.play();
						break;
					case 'playing':
						_audioPlayer.pause();
						break;
					default:
						throw "no media has been set";
				}
			};

			var playMedia = function(mediaUrl) {
				if (!_audioPlayer) {
					throw 'audioPlayer has not been set.';
				}
				if (!mediaUrl && !$scope.selectedMediaUrl) {
					throw 'mediaUrl has not been set.';
				}
				if (mediaUrl === _audioPlayer.src) {
					return;
				}

				var src = pathHelper.getFullMediaUrlPathFromMediaPath(mediaUrl);
				_audioPlayer.src = src;
				_audioPlayer.play();
			};

			$rootScope.$on('playMedia', function(event, args) {
				event.stopPropagation();
				playMedia(args);
			});
		},
		link: function(scope, element, attrs, controller) {
			var audioPlayer = window.document.getElementById('audioPlayer');
			controller.setAndInitAudioPlayer(audioPlayer);
		}
	};
});