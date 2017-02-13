'use strict';

jpoApp.directive("audioPlayer", function ($window) {
	return {
		restrict: 'E',
		replace: true,
		templateUrl: '/templates/controls/audioPlayer.html',
		scope: {
			mediaUrl: "=", // Means looks for folder-path attribute (= for object, & for function in parent scope, @ for just string or computed like {{}})
			mediaEnded: '&',
			playNext: '&',
			playPrevious: '&',
			playRequest: '&',
			currentMediaError: '&'
		},
		controller: function($scope, $rootScope, pathHelper) {

			var PLAYING = 'playing',
				PAUSED = 'paused',
				ENDED = 'ended',
				LEFT_BUTTON = 0;

			var _audioPlayerElements,
				_currentState = '',
				_currentSourceTag = null,
				_isDragingCursor = false,
				_isDragingVolume = false;

			this.setAndInitAudioPlayer = function(audioPlayerElements) {
				_audioPlayerElements = audioPlayerElements;
				initAudioPlayer();
			};

			//$scope.currentBtnUrl = "svg/play.svg";

			$scope.playOrPause = function() {
				playMedia(_audioPlayerElements.audioPlayer.src);
			};

			$scope.innerPlayMedia = function(mediaUrl) {
				$scope.playMedia({ mediaUrl: mediaUrl });
				playMedia(mediaUrl);
			};

			$scope.playOrPause = function() {
				playOrPause();
			};

			var initAudioPlayer = function () {
				var audioPlayer = _audioPlayerElements.audioPlayer;
				audioPlayer.addEventListener("playing", mediaPlayingStatusChange, true);
				audioPlayer.addEventListener("pause", mediaPauseStatusChange, true);
				audioPlayer.addEventListener("ended", mediaEndedStatusChange, true);
				audioPlayer.addEventListener("abort", mediaAbortedStatusChange, true);
				audioPlayer.addEventListener("error", mediaErrorStatusChange, true);

				audioPlayer.addEventListener("timeupdate", mediaTimeUpdateChange, true);
				audioPlayer.addEventListener("durationchange", updateMediaChunksBuffered, true);
				audioPlayer.addEventListener("progress", updateMediaChunksBuffered, true);

				var volumeLevelPercent = audioPlayer.volume * 100;
				_audioPlayerElements.volumeLevel.style.width = volumeLevelPercent + '%';

// BEGIN Cursor move media position
				_audioPlayerElements.volumeBar.addEventListener(
					'mousedown',
					function(event) {
						if (event.button !== LEFT_BUTTON) {
							return;
						}
						_audioPlayerElements.volumeLevel.style.left = event.offsetX + 'px';
						if (!_isDragingVolume) {
							_isDragingVolume = true;
						}
					},
					false
				);
				_audioPlayerElements.volumeBar.addEventListener(
					'mousemove',
					function(event) {
						if (!_isDragingVolume) {
							return;
						}

						var volumeBarWidth = _audioPlayerElements.volumeBar.clientWidth;
						var mouseX = event.offsetX;
						var volumePercent = mouseX / volumeBarWidth;
						var safeVolumePerOne = Math.min(Math.max(volumePercent, 0), 1);

						_audioPlayerElements.audioPlayer.volume = safeVolumePerOne;

						_audioPlayerElements.volumeLevel.style.width = mouseX + 'px';
					},
					false
				);
				_audioPlayerElements.volumeBar.addEventListener(
					'mouseup',
					function() {
						if (_isDragingVolume) {
							_isDragingVolume = false;
						}
					},
					false
				);
// END Cursor move media position

// BEGIN Cursor move media position
				_audioPlayerElements.timelineBar.addEventListener(
					'mousedown',
					function(event) {
						if (event.button !== LEFT_BUTTON) {
							return;
						}
						if (!_isDragingCursor) {
							_isDragingCursor = true;
						}
						_audioPlayerElements.cursor.style.left = event.offsetX + 'px';
					},
					false
				);
				_audioPlayerElements.cursor.addEventListener(
					'mousedown',
					function(event) {
						if (event.button !== LEFT_BUTTON) {
							return;
						}
						if (!_isDragingCursor) {
							_isDragingCursor = true;
						}

						var parentX = event.srcElement.offsetParent.offsetLeft;
						var mouseX = event.x;
						var cursorX = mouseX - parentX;

						_audioPlayerElements.cursor.style.left = cursorX + 'px';
					},
					false
				);
				_audioPlayerElements.cursor.addEventListener(
					'mousemove',
					function(event) {
						if (!_isDragingCursor) {
							return;
						}

						var timelineWidth = _audioPlayerElements.timeline.clientWidth;

						var parentX = event.srcElement.offsetParent.offsetLeft;
						var mouseX = event.x;
						var cursorX = mouseX - parentX;

						var cursorPercent = cursorX / timelineWidth;

						updateLandingPosition(cursorPercent);

						_audioPlayerElements.cursor.style.left = cursorX + 'px';
					},
					false
				);
				_audioPlayerElements.timelineBar.addEventListener(
					'mouseup',
					function(event) {
						if (event.button !== LEFT_BUTTON) {
							return;
						}
						if (_isDragingCursor) {
							_isDragingCursor = false;
						}

						var timelineWidth = _audioPlayerElements.timeline.clientWidth;

						var parentX = event.srcElement.offsetParent.offsetLeft;
						var mouseX = event.x;
						var cursorX = mouseX - parentX;

						var cursorPercent = cursorX / timelineWidth;

						setMediaPosition(cursorPercent);
					},
					false
				);
				_audioPlayerElements.cursor.addEventListener(
					'mouseup',
					function(event) {
						if (event.button !== LEFT_BUTTON) {
							return;
						}
						if (_isDragingCursor) {
							_isDragingCursor = false;
						}

						var timelineWidth = _audioPlayerElements.timeline.clientWidth;

						var parentX = event.srcElement.offsetParent.offsetLeft;
						var mouseX = event.x;
						var cursorX = mouseX - parentX;

						var cursorPercent = cursorX / timelineWidth;

						setMediaPosition(cursorPercent);
					},
					false
				);
// END Cursor move media position

				var setMediaPosition = function (cursorPercent) {
					var audioPlayer = _audioPlayerElements.audioPlayer;
					if (!audioPlayer.duration) {
						return;
					}

					var newPosition = cursorPercent * audioPlayer.duration;
					audioPlayer.currentTime = newPosition;
				};
			};

			var updateMediaChunksBuffered = function() {
				var audioPlayer = _audioPlayerElements.audioPlayer;
				var buffer = audioPlayer.buffered;
				var bufferLength = buffer.length;

				if (bufferLength === 0) {
					return;
				}
				if (!audioPlayer.duration) {
					return;
				}

				var start = buffer.start(0);
				var end = buffer.end(0);
				var duration = audioPlayer.duration;

				// Compute start position in percent
				var startPercent = (start / duration) * 100;

				// Compute end position in percent
				var endPercent = (end / duration) * 100;
				var loadedChunksWidth = endPercent - startPercent;

				var loadedChunks = _audioPlayerElements.loadedChunks;
				loadedChunks.style.left = startPercent + '%';
				loadedChunks.style.width = loadedChunksWidth + '%';
			};

			var mediaTimeUpdateChange = function() {
				var audioPlayer = _audioPlayerElements.audioPlayer;
				var currentTime = audioPlayer.currentTime;
				var audioDuration = audioPlayer.duration;
				var timeRemaining = audioDuration - currentTime;

				var currentTimeHHMMSS = (new Date)
					.clearTime()
					.addSeconds(currentTime)
					.toString('H:mm:ss');
				var timeRemainingHHMMSS = (new Date)
					.clearTime()
					.addSeconds(timeRemaining)
					.toString('H:mm:ss');

				if (!_isDragingCursor) {
					var cursorPositionPercent = (currentTime / audioDuration) * 100;
					_audioPlayerElements.cursor.style.left = cursorPositionPercent + '%';

					_audioPlayerElements.elapsedTime.innerText = currentTimeHHMMSS;
					_audioPlayerElements.remainingTime.innerText = '-' + timeRemainingHHMMSS;
				}
			};

			var updateLandingPosition = function(cursorPercent) {
				var audioPlayer = _audioPlayerElements.audioPlayer;
				var currentTime = cursorPercent * audioPlayer.duration;
				var audioDuration = audioPlayer.duration;
				var timeRemaining = audioDuration - currentTime;

				var currentTimeHHMMSS = (new Date)
					.clearTime()
					.addSeconds(currentTime)
					.toString('H:mm:ss');
				var timeRemainingHHMMSS = (new Date)
					.clearTime()
					.addSeconds(timeRemaining)
					.toString('H:mm:ss');

				_audioPlayerElements.elapsedTime.innerText = currentTimeHHMMSS;
				_audioPlayerElements.remainingTime.innerText = '-' + timeRemainingHHMMSS;
			};

			var mediaErrorStatusChange = function() {
				if ($scope.currentMediaError) {
					$scope.currentMediaError(_audioPlayerElements.audioPlayer.error);
				}
			};

			var mediaAbortedStatusChange = function() {
				_currentState = '';
				turnPauseButtonToPlay();
			};

			var mediaEndedStatusChange = function () {
				if ($scope.mediaEnded) {
					$scope.mediaEnded();
				}
			};

			var mediaPlayingStatusChange = function() {
				_currentState = PLAYING;
				turnPlayButtonToPause();
			};

			var mediaPauseStatusChange = function() {
				_currentState = PAUSED;
				turnPauseButtonToPlay();
			};

			var turnPlayButtonToPause = function () {
				_audioPlayerElements.btnPlay.src = "svg/pause.svg";
			};

			var turnPauseButtonToPlay = function () {
				_audioPlayerElements.btnPlay.src = "svg/play.svg";
			};

			var playOrPause = function() {
				// If media is set, play it. otherwise, ask the queue
				if (!_currentState) {
					$scope.playRequest();
					return;
				}

				switch (_currentState) {
					case ENDED:
					case PAUSED:
						_audioPlayerElements.audioPlayer.play();
						break;
					case PLAYING:
						_audioPlayerElements.audioPlayer.pause();
						break;
					default:
						throw "no media has been set";
				}
			};

			$rootScope.$on('playMedia', function(event, args) {
				playMedia(args);
			});

			$rootScope.$on('stopMedia', function() {
				stopMedia();
			});

			var playMedia = function(mediaOrFile) {
				var audioPlayer = _audioPlayerElements.audioPlayer;
				if (!audioPlayer) {
					throw 'audioPlayer has not been set.';
				}

				var src = pathHelper.getFullMediaUrlPathFromMediaPath(mediaOrFile);
				if (!src && !$scope.selectedMediaUrl) {
					throw 'mediaUrl has not been set.';
				}
				if (src === audioPlayer.src) {
					return;
				}

				var isAudioSourceTagPresent = _currentSourceTag !== null;
				if (!isAudioSourceTagPresent) {
					var sourceTag = document.createElement('source');
					_currentSourceTag = sourceTag;
					audioPlayer.appendChild(sourceTag);
				}

				_currentSourceTag.src = src;
				audioPlayer.load();
				audioPlayer.play();
			};

			var stopMedia = function() {
				var audioPlayer = _audioPlayerElements.audioPlayer;
				if (!audioPlayer) {
					throw 'audioPlayer has not been set.';
				}

				audioPlayer.removeChild(_currentSourceTag);
				audioPlayer.load();
				_currentSourceTag = null;
			};
		},
		link: function(scope, element, attrs, controller) {
			var doc = $window.document;

			var audioPlayerElements = {
				audioPlayer: doc.getElementById('audioPlayer'),
				elapsedTime: doc.getElementById('elapsed-time'),
				remainingTime: doc.getElementById('remaining-time'),
				loadedChunks: doc.getElementById('loaded-chunks'),
				timelineBar: doc.getElementById('timeline-bar'),
				timeline: doc.getElementById('timeline'),
				volumeLevel: doc.getElementById('volume-level'),
				volumeBar: doc.getElementById('volume-bar'),
				cursor: doc.getElementById('cursor'),
				btnPlay: doc.getElementById('btnPlay')
			};

			controller.setAndInitAudioPlayer(audioPlayerElements);
		}
	};
});