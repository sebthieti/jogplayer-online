'use strict';

jpoApp.factory('audioPlayerBusiness', function() {
	var PlayerState = Jpo.PlayerState;

	var playingMediumSubject = new Rx.BehaviorSubject();
	var playControlSubject = new Rx.BehaviorSubject(PlayerState.Unknown);

	var observePlayingMedium = function() {
		return playingMediumSubject.whereIsDefined();
	};

	var getAndObservePlayControl = function() {
		return playControlSubject;
	};

	var playMedium = function(mediumQueueVm) {
		playingMediumSubject.onNext(mediumQueueVm);
	};

	var playFirst = function() {
		playControlSubject.onNext(PlayerState.PlayFirst);
	};

	var playNext = function() {
		playControlSubject.onNext(PlayerState.Next);
	};

	var playPrevious = function() {
		playControlSubject.onNext(PlayerState.Previous);
	};

	var stop = function() {
		playControlSubject.onNext(PlayerState.Stop);
	};

	var playEnded = function() {
		playControlSubject.onNext(PlayerState.Ended);
	};

	var play = function() {
		playControlSubject.onNext(PlayerState.Play);
	};

	var mediumError = function() {
		playControlSubject.onNext(PlayerState.Error);
	};

	return {
		observePlayingMedium: observePlayingMedium,
		getAndObservePlayControl: getAndObservePlayControl,
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