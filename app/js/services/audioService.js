jpoApp.factory('audioService', ['$q', function($q) {
	var PlayerState = Jpo.PlayerState;
	var currentState = PlayerState.Unknown;
	var eventSubject = new Rx.Subject();
	var audioPlayer,
		backupVolume = 0;

	function initAudioPlayer() {
		initAndGiveAudio();
		initEvents();
	}

	function initAndGiveAudio() {
		audioPlayer = document.getElementById('audioPlayer');
	}

	function initEvents() {
		audioPlayer.addEventListener("playing", function() {
			currentState = PlayerState.Play;
			eventSubject.onNext({ name: currentState, value: null });
		}, true);

		audioPlayer.addEventListener("pause", function() {
			currentState = PlayerState.Pause;
			eventSubject.onNext({ name: currentState, value: null });
		}, true);

		audioPlayer.addEventListener("ended", function() {
			currentState = PlayerState.Ended;
			eventSubject.onNext({ name: currentState, value: null });
		}, true);

		audioPlayer.addEventListener("abort", function() {
			currentState = PlayerState.Aborted;
			eventSubject.onNext({ name: currentState, value: null });
		}, true);

		audioPlayer.addEventListener("error", function() {
			// Some browsers fires an error when a medium format can't be read.
			// So only fire an event when we tried the latest format.
			var ext = audioPlayer.currentSrc.substring(audioPlayer.currentSrc.lastIndexOf('.'));
			if (ext === '.mp3') { // MP3 is the last chance try
				currentState = PlayerState.Error;
				eventSubject.onNext({ name: PlayerState.Error, value: null });
			}
		}, true);

		audioPlayer.addEventListener("timeupdate", function(ev) {
			eventSubject.onNext({
				name: PlayerState.TimeUpdate,
				value: {
					currentTime: ev.target.currentTime,
					duration: ev.target.duration
				}
			});
		}, true);

		audioPlayer.addEventListener("durationchange", function(ev) {
			eventSubject.onNext({
				name: PlayerState.DurationChange,
				value: {
					duration: ev.target.duration,
					buffered: ev.target.buffered
				}
			});
		}, true);

		audioPlayer.addEventListener("progress", function(ev) {
			eventSubject.onNext({
				name: PlayerState.Progress,
				value: {
					duration: ev.target.duration,
					buffered: ev.target.buffered
				}
			});
		}, true);
	}

	function getState() {
		return currentState;
	}

	function getMediumDuration() {
		return audioPlayer.duration;
	}

	function observeEvents() {
		return eventSubject;
	}

	function observePlayingMedium() {
		return observeEvents()
			.where(function(e) { return e.name === PlayerState.MediumSet })
			.select(function (e) { return e.value.mediumOrFile });
	}

	function observeMediumEnded() {
		return observeEvents()
			.where(function(e) { return e.name === PlayerState.Ended });
	}

	function observeVolume() {
		return observeEvents()
			.where(function(e) { return e.name === Jpo.PlayerState.Volume })
			.select(function (e) { return e.value.volume });
	}

	function observeTimeUpdate() {
		return observeEvents()
			.where(function(e) { return e.name === Jpo.PlayerState.TimeUpdate })
			.select(function (e) { return e.value });
	}

	function playOrPause() {
		// If media is set, play it. otherwise, ask the queue
		switch (currentState) {
			case PlayerState.Ended:
			case PlayerState.Pause:
				audioPlayer.play();
				break;
			case PlayerState.Play:
				audioPlayer.pause();
				break;
			case PlayerState.Error:
				break;
			case PlayerState.Unknown:
				break;
			default:
				audioPlayer.play();
				break;
		}
	}

	function stop() {
		// Search for source tag to set medium to read.
		var allSourceTags = audioPlayer.querySelectorAll('source');
		_.each(allSourceTags, function(tag) {
			audioPlayer.removeChild(tag);
		});

		audioPlayer.load();
	}

	function getVolume() {
		return audioPlayer.volume;
	}

	function setVolume(volumePercent) {
		var safeVolumePerOne = Math.min(Math.max(volumePercent, 0), 1);

		audioPlayer.volume = safeVolumePerOne;

		eventSubject.onNext({
			name: PlayerState.Volume,
			value: { volume: safeVolumePerOne }
		});
	}

	function unmute() {
		setVolume(backupVolume);
	}

	function mute() {
		if (audioPlayer.volume != 0) {
			backupVolume = getVolume();
		}
		setVolume(0);
	}

	function setMediumPositionByTime(timePosition) {
		if (!audioPlayer.duration) {
			return;
		}
		if (!timePosition || timePosition > audioPlayer.duration) {
			return;
		}
		audioPlayer.currentTime = timePosition;
	}

	function setMediumPositionByRatio(cursorPercent) {
		if (!audioPlayer.duration) {
			return;
		}
		audioPlayer.currentTime = cursorPercent * audioPlayer.duration;
	}

	function setMediumToPlayAndPlayAsync(mediumOrFile) {
		return setMediumToPlayAsync(mediumOrFile)
			.then(function() {
				audioPlayer.play();
			});
	}

	function setMediumToPlayAsync(mediumOrFile) {
		var deferred = $q.defer();

		function mediumToPlayLoaded() {
			audioPlayer.removeEventListener("loadeddata", mediumToPlayLoaded);
			currentState = PlayerState.MediumLoaded;
			deferred.resolve();
		}
		audioPlayer.addEventListener("loadeddata", mediumToPlayLoaded, true);

		var mediumModel = mediumOrFile.model || mediumOrFile;

		var extPos = mediumModel.selectSelfPlayFromLinks().lastIndexOf(".");
		var mediumExt = mediumModel.selectSelfPlayFromLinks().substring(extPos);

		// Search for source tag to set medium to read.
		var allSourceTags = audioPlayer.querySelectorAll('source');
		_.each(allSourceTags, function(tag) {
			audioPlayer.removeChild(tag);
		});

		var src = mediumModel.selectSelfPlayFromLinks();
		audioPlayer.appendChild(Helpers.MediumSourceTag.build(src));

		// We'll have mp3 and ogg, in case the browser can't play
		if (mediumExt === ".mp3" || mediumExt === ".ogg") {
			if (mediumExt === ".mp3") {
				// Add opposite ext
				audioPlayer.appendChild(Helpers.MediumSourceTag.build(src, '.ogg'));
			} else {
				// Add opposite ext
				audioPlayer.appendChild(Helpers.MediumSourceTag.build(src, '.mp3'));
			}
		} else {
			audioPlayer.appendChild(Helpers.MediumSourceTag.build(src, '.ogg'));
			audioPlayer.appendChild(Helpers.MediumSourceTag.build(src, '.mp3'));
		}
		audioPlayer.load();

		eventSubject.onNext({
			name: PlayerState.MediumSet, // TODO To avoid event data corruption, make name private, give getName
			value: { mediumOrFile: mediumOrFile }
		});

		return deferred.promise;
	}

	initAudioPlayer();

	return {
		getState: getState,
		getMediumDuration: getMediumDuration,
		observeEvents: observeEvents,
		observePlayingMedium: observePlayingMedium,
		observeMediumEnded: observeMediumEnded,
		observeVolume: observeVolume,
		observeTimeUpdate: observeTimeUpdate,
		setMediumToPlayAndPlayAsync: setMediumToPlayAndPlayAsync,
		setMediumToPlayAsync: setMediumToPlayAsync,
		playOrPause: playOrPause,
		unmute: unmute,
		mute: mute,
		stop: stop,
		getVolume: getVolume,
		setVolume: setVolume,
		setMediumPositionRatio: setMediumPositionByRatio,
		setMediumPositionByTime: setMediumPositionByTime
	}
}]);