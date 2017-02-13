'use strict';

jpoApp.factory("AudioPlayerControl", function () {
	function AudioPlayerControl(controlElements) {
		var ButtonMap = Jpo.ButtonMap;
		var PlayerState = Jpo.PlayerState;
		var linkHelpers = Helpers.linkHelpers;

		var _currentStateSubject = new Rx.BehaviorSubject(PlayerState.Unknown);
		var _isDraggingCursor = false;

		var _audioPlayerElements;

		function init(controlDomElement) {
			var audioPlayerElements = controlElements.mapOwnProperties(function(controlElement) {
				return controlDomElement.getElementById(controlElement);
			});
			setAndInitAudioPlayer(audioPlayerElements);
		}

		function setAndInitAudioPlayer(audioPlayerElements) {
			_audioPlayerElements = audioPlayerElements;
			initAudioPlayer();
		}

		function initAudioPlayer() {
			initEvents();
			initVolumeBar();
			initTimeLine();
			initCursor();
		}

		function initEvents() {
			var audioPlayer = _audioPlayerElements.audioPlayer;

			audioPlayer.addEventListener("playing", function() {
				_currentStateSubject.onNext(PlayerState.Play);
				turnPlayButtonToPause();
			}, true);

			audioPlayer.addEventListener("pause", function() {
				_currentStateSubject.onNext(PlayerState.Pause);
				turnPauseButtonToPlay();
			}, true);

			audioPlayer.addEventListener("ended", function() {
				_currentStateSubject.onNext(PlayerState.Ended);
			}, true);

			audioPlayer.addEventListener("abort", function() {
				_currentStateSubject.onNext(PlayerState.Unknown);
				turnPauseButtonToPlay();
			}, true);

			audioPlayer.addEventListener("error", function() {
				_currentStateSubject.onNext(PlayerState.Error);
			}, true);

			audioPlayer.addEventListener("timeupdate", function() {
				var audioPlayer = _audioPlayerElements.audioPlayer;
				var currentTime = audioPlayer.currentTime;
				var audioDuration = audioPlayer.duration;
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

				if (_isDraggingCursor) {
					return;
				}

				var timeLineContainer = _audioPlayerElements.timeLineContainer;
				var cursorPositionRatio = (currentTime / audioDuration);
				var cursorOffsetX = timeLineContainer.offsetWidth * cursorPositionRatio;
				_audioPlayerElements.cursor.style.transform = 'translateX(' + cursorOffsetX + 'px)';

				_audioPlayerElements.elapsedTime.innerText = currentTimeHHMMSS;
				_audioPlayerElements.remainingTime.innerText = '-' + timeRemainingHHMMSS;
				//updateCursorFromMediumPosition();

			}, true);

			//function updateCursorFromMediumPosition() {
			//}

			audioPlayer.addEventListener("durationchange", updateMediaChunksBuffered, true);
			audioPlayer.addEventListener("progress", updateMediaChunksBuffered, true);
		}

		function updateMediaChunksBuffered() {
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
		}

		function playOrPause() {
			_currentStateSubject.getValueAsync(function(currentState) {
				// If media is set, play it. otherwise, ask the queue
				switch (currentState) {
					case PlayerState.Ended:
					case PlayerState.Pause:
						_audioPlayerElements.audioPlayer.play();
						break;
					case PlayerState.Play:
						_audioPlayerElements.audioPlayer.pause();
						break;
				}
			});
		}

		function turnPauseButtonToPlay() {
			var classes = _audioPlayerElements.btnPlay.classList;
			classes.remove('icon-pause');
			classes.add('icon-play');
		}

		function turnPlayButtonToPause() {
			var classes = _audioPlayerElements.btnPlay.classList;
			classes.remove('icon-play');
			classes.add('icon-pause');
		}

		function getTimeFormatForDuration(time) {
			if (time < 3600) {
				return 'm:ss';
			}
			return 'H:mm:ss';
		}

		function updateLandingPosition(cursorPercent) {
			var audioPlayer = _audioPlayerElements.audioPlayer;
			var currentTime = cursorPercent * audioPlayer.duration;
			var audioDuration = audioPlayer.duration;
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

			_audioPlayerElements.elapsedTime.innerText = currentTimeHHMMSS;
			_audioPlayerElements.remainingTime.innerText = '-' + timeRemainingHHMMSS;
		}

		function initCursor() {
			var timeLine = _audioPlayerElements.timeLine;
			var cursor = _audioPlayerElements.cursor;

			cursor.addEventListener('mousedown', function(event) {
				if (event.button !== ButtonMap.Left) { // isLeftButtonDragging()
					return;
				}
				if (!_isDraggingCursor) {
					_isDraggingCursor = true;
				}

				var cursorX = relativeXFromDirectParent(event);

				cursor.style.transform = 'translateX(' + cursorX + 'px)';
			}, false);

			cursor.addEventListener('mousemove', function(event) {
				if (!_isDraggingCursor) {
					return;
				}

				var cursorX = relativeXFromDirectParent(event);
				var cursorPercent = cursorX / timeLine.clientWidth;

				updateLandingPosition(cursorPercent);

				cursor.style.transform = 'translateX(' + cursorX + 'px)';
			}, false);

			cursor.addEventListener('mouseup', function(event) {
				if (event.button !== ButtonMap.Left) {
					return;
				}
				if (_isDraggingCursor) {
					_isDraggingCursor = false;
				}

				var cursorX = relativeXFromDirectParent(event);
				var cursorPercent = cursorX / timeLine.clientWidth;

				setMediumPosition(cursorPercent);
			}, false);
		}

		function initTimeLine() {
			var timeLine = _audioPlayerElements.timeLine;
			var cursor = _audioPlayerElements.cursor;

			timeLine.addEventListener('mousedown', function(event) {
				if (event.button !== ButtonMap.Left) {
					return;
				}
				if (!_isDraggingCursor) {
					_isDraggingCursor = true;
				}
				cursor.style.transform = 'translateX(' + event.offsetX + 'px)';
			}, false);

			timeLine.addEventListener('mouseup', function(event) {
				if (event.button !== ButtonMap.Left) {
					return;
				}
				if (_isDraggingCursor) {
					_isDraggingCursor = false;
				}

				var cursorX = relativeXFromDirectParent(event);
				var cursorPercent = cursorX / timeLine.clientWidth;

				setMediumPosition(cursorPercent);
			}, false);
		}

		function updateVolume(mouseX) {
			var volumeBar = _audioPlayerElements.volumeBarContainer;
			var volumeBarWidth = volumeBar.clientWidth;
			var volumePercent = mouseX / volumeBarWidth;
			var safeVolumePerOne = Math.min(Math.max(volumePercent, 0), 1);

			_audioPlayerElements.audioPlayer.volume = safeVolumePerOne;

			var volumeOffset = -volumeBarWidth + mouseX;
			_audioPlayerElements.volumeBar.style.transform = 'translateX(' + volumeOffset + 'px)';
		}

		function initVolumeBar() {
			var volumeBarWidth = _audioPlayerElements.volumeBarContainer.clientWidth;
			var volumeXPos = volumeBarWidth * audioPlayer.volume;
			var volumeOffset = volumeBarWidth - volumeXPos;

			_audioPlayerElements.volumeBar.style.transform = 'translateX(' + volumeOffset + 'px)';

			var volumeBarContainer = _audioPlayerElements.volumeBarContainer;
			observeElementEvent(volumeBarContainer, 'mousedown')
				.where(function(event) { return event.button === ButtonMap.Left })
				.do(function(event) { updateVolume(event.layerX) })
				.selectMany(function(__) {
					return observeElementEvent(volumeBarContainer, 'mousemove');
				})
				.do(function(event) { updateVolume(event.layerX) })
				.takeUntil(observeElementEvent(volumeBarContainer, 'mouseup'))
				.repeat()
				.silentSubscribe();
		}

		function relativeXFromDirectParent(event) {
			var mouseX = event.x;
			var parentX = event.srcElement.offsetParent.offsetLeft;
			var cursorX = mouseX - parentX;
			return cursorX;
		}

		function observeElementEvent(element, eventName) {
			return Rx.Observable.fromEventPattern(
				function(h) { element.addEventListener(eventName, h, false) },
				function(h) { element.removeEventListener(eventName, h, false) }
			);
		}

		function setMediumPosition (cursorPercent) {
			var audioPlayer = _audioPlayerElements.audioPlayer;
			if (!audioPlayer.duration) {
				return;
			}

			var newPosition = cursorPercent * audioPlayer.duration;
			audioPlayer.currentTime = newPosition;
		}

		function playMedium(mediaOrFile) {
			var audioPlayer = _audioPlayerElements.audioPlayer;

			// Ensure cursor is visible
			_audioPlayerElements.cursor.classList.remove('hidden');

			// Search for source tag to set medium to read.
			var sourceTag = audioPlayer.querySelector('source');

			var isAudioSourceTagPresent = sourceTag !== null;
			if (!isAudioSourceTagPresent) {
				sourceTag = document.createElement('source');
				audioPlayer.appendChild(sourceTag);
			}

			sourceTag.src = mediaOrFile.selectSelfPlayFromLinks();//linkHelpers.selectSelfPlayFromLinks(mediaOrFile.links);

			// TODO Type w/ codec should be specified
			//_currentSourceTag.type = 'audio/mpeg';
			audioPlayer.load();
			audioPlayer.play();
		}

		function stopMedium() {
			var audioPlayer = _audioPlayerElements.audioPlayer;

			var sourceTag = audioPlayer.querySelector('source');
			if (sourceTag === null) {
				return;
			}
			audioPlayer.removeChild(sourceTag);
			audioPlayer.load();
		}

		function observeCurrentState() {
			return _currentStateSubject;
		}

		return { //scope, element, attrs, controller
			init: init,
			playMedium: playMedium,
			playOrPause: playOrPause,
			stopMedium: stopMedium,
			observeCurrentState: observeCurrentState
		}
	}
	return AudioPlayerControl;
});