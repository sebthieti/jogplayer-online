'use strict';

jpoApp.directive("audioPlayer", ['audioService', 'mediaQueueBusiness', '$timeout', function (audioService, mediaQueueBusiness, $timeout) {
	var PlayerState = Jpo.PlayerState;
	var ButtonMap = Jpo.ButtonMap;
	var controlElements = {
		elapsedTime: 'elapsed-time',
		remainingTime: 'remaining-time',
		loadedChunks: 'loaded-chunks',
		timeLineContainer: 'time-line-container',
		timeLine: 'time-line',
		volumeBar: 'volume-bar',
		volumeBarContainer: 'volume-bar-container',
		cursor: 'cursor',
		btnPlay: 'btnPlay'
	};

	return {
		restrict: 'E',
		replace: true,
		templateUrl: '/templates/controls/audioPlayer.html',
		controller: function($scope) {
			$scope.isMuting = false;
			$scope.playOrPause = function() {
				if (audioService.getState() === PlayerState.Unknown) {
					mediaQueueBusiness.playFirst();
				} else {
					audioService.playOrPause();
				}
			};

			$scope.playNext = function() {
				mediaQueueBusiness.playNext();
			};

			$scope.playPrevious = function() {
				mediaQueueBusiness.playPrevious();
			};

			$scope.mute = function() {
				$scope.isMuting = !$scope.isMuting;
				if ($scope.isMuting) {
					audioService.mute();
				} else {
					audioService.unmute();
				}
			};
		},
		link: function(scope){
			var isDraggingCursor = false;
			var audioPlayerElements;

			function init() {
				audioPlayerElements = controlElements.mapOwnProperties(function(controlElement) {
					return window.document.getElementById(controlElement);
				});
				initAudioPlayer();
			}

			function initAudioPlayer() {
				initListenToAudioEvents();
				initVolumeBar();
				initTimeLine();
				initCursorEvents();
				initCursorVisibleOnMediumSet();
			}

			function initListenToAudioEvents() {
				updateTimelineAndCursorOnTimeUpdate();
				updateMediaChunksBufferedOnProgressOrDuration();
				updatePlayButtonStatusToState();
				updateVolumeBarOnChange();
			}

			function updateTimelineAndCursorOnTimeUpdate() {
				return audioService
					.observeTimeUpdate()
					.do(function(timeUpdateSet) {
						var currentTime = timeUpdateSet.currentTime;
						var audioDuration = timeUpdateSet.duration;
						var timeRemaining = audioDuration - currentTime;

						var format = getTimeFormatForDuration(currentTime);
						var currentTimeHHMMSS = (new Date)
							.clearTime()
							.addSeconds(currentTime)
							.toString(format);
						var timeRemainingHHMMSS = (new Date)
							.clearTime()
							.addSeconds(timeRemaining)
							.toString(format);

						if (isDraggingCursor) {
							return;
						}

						var timeLineContainer = audioPlayerElements.timeLineContainer;
						var cursorPositionRatio = (currentTime / audioDuration);
						var cursorOffsetX = timeLineContainer.offsetWidth * cursorPositionRatio;
						audioPlayerElements.cursor.style.transform = 'translateX(' + cursorOffsetX + 'px)';

						audioPlayerElements.elapsedTime.textContent = currentTimeHHMMSS;
						audioPlayerElements.remainingTime.textContent = '-' + timeRemainingHHMMSS;
					})
					.silentSubscribe();
			}

			function getTimeFormatForDuration(time) {
				if (time < 3600) {
					return 'm:ss';
				}
				return 'H:mm:ss';
			}

			function updateMediaChunksBufferedOnProgressOrDuration() {
				return audioService
					.observeEvents()
					.where(function(e) {
						return e.name === PlayerState.DurationChange ||
							e.name === PlayerState.Progress
					})
					.select(function(e) { return e.value })
					.do(function(durationProgressSet) {
						var buffer = durationProgressSet.buffered;
						var bufferLength = buffer.length;

						if (bufferLength === 0) {
							return;
						}
						if (!durationProgressSet.duration) {
							return;
						}

						var start = buffer.start(0);
						var end = buffer.end(0);
						var duration = durationProgressSet.duration;

						// Compute start position in percent
						var startPercent = (start / duration) * 100;

						// Compute end position in percent
						var endPercent = (end / duration) * 100;
						var loadedChunksWidth = endPercent - startPercent;

						var loadedChunks = audioPlayerElements.loadedChunks;
						loadedChunks.style.left = startPercent + '%';
						loadedChunks.style.width = loadedChunksWidth + '%';
					})
					.silentSubscribe();
			}

			function updatePlayButtonStatusToState() {
				audioService
					.observeEvents()
					.where(function(e) {
						return e.name === PlayerState.Unknown ||
							e.name === PlayerState.Pause ||
							e.name === PlayerState.Play
					})
					.do(function(e) {
						if (e.name === PlayerState.Play) {
							turnPlayButtonToPause();
						} else {
							turnPauseButtonToPlay();
						}
					})
					.silentSubscribe();
			}

			function turnPauseButtonToPlay() {
				var classes = audioPlayerElements.btnPlay.classList;
				classes.remove('icon-pause2');
				classes.add('icon-play3');
			}

			function turnPlayButtonToPause() {
				var classes = audioPlayerElements.btnPlay.classList;
				classes.remove('icon-play3');
				classes.add('icon-pause2');
			}

			function initVolumeBar() {
				var volumeBarWidth = audioPlayerElements.volumeBarContainer.clientWidth;
				var volumeXPos = volumeBarWidth * audioService.getVolume();
				var volumeOffset = volumeBarWidth - volumeXPos;

				audioPlayerElements.volumeBar.style.transform = 'translateX(' + volumeOffset + 'px)';

				var volumeBarContainer = audioPlayerElements.volumeBarContainer;

				observeElementEvent(volumeBarContainer, 'mousedown')
					.where(function(event) { return event.button === ButtonMap.Left })
					.do(function(event) {
						var volumeBarOffset = event.clientX - event.target.offsetLeft;
						updateVolume(volumeBarOffset);
					})
					.selectMany(function() {
						return observeElementEvent(volumeBarContainer, 'mousemove');
					})
					.do(function(event) {
						var volumeBarOffset = event.clientX - event.target.offsetLeft;
						updateVolume(volumeBarOffset);
					})
					.takeUntil(observeElementEvent(volumeBarContainer, 'mouseup'))
					.repeat()
					.silentSubscribe();
			}

			function updateVolume(mouseX) {
				var volumeBar = audioPlayerElements.volumeBarContainer;
				var volumeBarWidth = volumeBar.clientWidth;
				var volumePercent = mouseX / volumeBarWidth;
				var safeVolumePerOne = Math.min(Math.max(volumePercent, 0), 1);

				var volumeOffset = -volumeBarWidth + mouseX;
				audioPlayerElements.volumeBar.style.transform = 'translateX(' + volumeOffset + 'px)';

				audioService.setVolume(safeVolumePerOne);
			}

			function updateVolumeBarOnChange() {
				audioService
					.observeVolume()
					.do(function(vol) {
						$timeout(function() {
							// To turn back the normal vol icon when user just unmute by changing volume
							if (scope.isMuting && vol != 0) {
								scope.isMuting = false;
							}
						});

						var volumeBar = audioPlayerElements.volumeBarContainer;
						var volumeBarWidth = volumeBar.clientWidth;
						var mouseX = volumeBarWidth * vol;

						var volumeOffset = -volumeBarWidth + mouseX;
						audioPlayerElements.volumeBar.style.transform = 'translateX(' + volumeOffset + 'px)';
					})
					.silentSubscribe();
			}

			function observeElementEvent(element, eventName) {
				return Rx.Observable.fromEventPattern(
					function(h) { element.addEventListener(eventName, h, false) },
					function(h) { element.removeEventListener(eventName, h, false) }
				);
			}

			function initTimeLine() {
				var timeLine = audioPlayerElements.timeLine;
				var cursor = audioPlayerElements.cursor;

				timeLine.addEventListener('mousedown', function(event) {
					if (event.button !== ButtonMap.Left) {
						return;
					}
					if (!isDraggingCursor) {
						isDraggingCursor = true;
					}
					cursor.style.transform = 'translateX(' + event.offsetX + 'px)';
				}, false);

				timeLine.addEventListener('mouseup', function(event) {
					if (event.button !== ButtonMap.Left) {
						return;
					}
					if (isDraggingCursor) {
						isDraggingCursor = false;
					}

					var cursorX = relativeXFromDirectParent(event);
					var cursorPercent = cursorX / timeLine.clientWidth;

					audioService.setMediumPositionRatio(cursorPercent);
				}, false);
			}

			function initCursorEvents() {
				var timeLine = audioPlayerElements.timeLine;
				var cursor = audioPlayerElements.cursor;

				cursor.addEventListener('mousedown', function(event) {
					if (event.button !== ButtonMap.Left) {
						return;
					}
					if (!isDraggingCursor) {
						isDraggingCursor = true;
					}

					var cursorX = relativeXFromDirectParent(event);

					cursor.style.transform = 'translateX(' + cursorX + 'px)';
				}, false);

				cursor.addEventListener('mousemove', function(event) {
					if (!isDraggingCursor) {
						return;
					}

					var cursorX = relativeXFromDirectParent(event);
					var cursorParentWidth = event.target.offsetParent.clientWidth;
					if (cursorX < 0 || cursorX > cursorParentWidth) {
						return;
					}

					var cursorPercent = cursorX / timeLine.clientWidth;

					updateLandingPosition(cursorPercent);

					cursor.style.transform = 'translateX(' + cursorX + 'px)';
				}, false);

				cursor.addEventListener('mouseup', function(event) {
					if (event.button !== ButtonMap.Left) {
						return;
					}
					if (isDraggingCursor) {
						isDraggingCursor = false;
					}

					var cursorX = relativeXFromDirectParent(event);
					var cursorPercent = cursorX / timeLine.clientWidth;

					audioService.setMediumPositionRatio(cursorPercent);
				}, false);
			}

			function relativeXFromDirectParent(event) {
				var parentX = event.target.offsetParent.offsetLeft;
				return event.clientX - parentX;
			}

			function updateLandingPosition(cursorPercent) {
				var mediumDuration = audioService.getMediumDuration();
				var currentTime = cursorPercent * mediumDuration;
				var timeRemaining = mediumDuration - currentTime;

				var format = getTimeFormatForDuration(currentTime);
				var currentTimeHHMMSS = (new Date)
					.clearTime()
					.addSeconds(currentTime)
					.toString(format);
				var timeRemainingHHMMSS = (new Date)
					.clearTime()
					.addSeconds(timeRemaining)
					.toString(format);

				audioPlayerElements.elapsedTime.textContent = currentTimeHHMMSS;
				audioPlayerElements.remainingTime.textContent = '-' + timeRemainingHHMMSS;
			}

			function initCursorVisibleOnMediumSet() {
				audioService
					.observePlayingMedium()
					.do(function() {
						// Ensure cursor is visible
						audioPlayerElements.cursor.classList.remove('hidden');
					})
					.silentSubscribe();
			}

			init();
		}
	};
}]);