'use strict';

jpoApp.factory('audioPlayerBusiness', function() {
	var PlayerState = Jpo.PlayerState;

	var playingMediumSubject = new Rx.BehaviorSubject();
	var playControlSubject = new Rx.BehaviorSubject(PlayerState.Unknown);
	var lastMediumPosition = 0;

	function observePlayingMedium() {
		return playingMediumSubject.whereIsDefined();
	}

	function observeMediumPosition() {
		return mediumPositionSubject;
	}

	function getMediumPosition() {
		return lastMediumPosition;
	}

	function setMediumPosition(pos) {
		lastMediumPosition = pos;
	}

	function getAndObservePlayControl() {
		return playControlSubject;
	}

	function playMedium(mediumQueueVm) {
		playingMediumSubject.onNext(mediumQueueVm);
	}

	function playFirst() {
		playControlSubject.onNext(PlayerState.PlayFirst);
	}

	function playNext() {
		playControlSubject.onNext(PlayerState.Next);
	}

	function playPrevious() {
		playControlSubject.onNext(PlayerState.Previous);
	}

	function stop() {
		playControlSubject.onNext(PlayerState.Stop);
	}

	function playEnded() {
		playControlSubject.onNext(PlayerState.Ended);
	}

	function play() {
		playControlSubject.onNext(PlayerState.Play);
	}

	function mediumError() {
		playControlSubject.onNext(PlayerState.Error);
	}

	return {
		observePlayingMedium: observePlayingMedium,
		observeMediumPosition: observeMediumPosition,
		getAndObservePlayControl: getAndObservePlayControl,
		getMediumPosition: getMediumPosition,
		setMediumPosition: setMediumPosition,
		playMedium: playMedium,
		stop: stop,
		playEnded: playEnded,
		playFirst: playFirst,
		playNext: playNext,
		playPrevious: playPrevious,
		play: play,
		mediumError: mediumError
	}
});