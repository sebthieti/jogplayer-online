'use strict';

jpoApp.factory('audioPlayerBusiness', function() {
	var PlayerState = Jpo.PlayerState;

	var playingMediumSubject = new Rx.BehaviorSubject();
	var volumeSubject = new Rx.BehaviorSubject();
	var playControlSubject = new Rx.BehaviorSubject(PlayerState.Unknown);
	var mediumPositionSubject = new Rx.Subject();
	var currentStateSubject = new Rx.BehaviorSubject(PlayerState.Unknown);

	var pendingList = [];

	var _handlers = null;

	function init(handlers) {
		_handlers = handlers;
		proceedPendingSettings();
	}

	function observeCurrentState() {
		return currentStateSubject;
	}

	function observePlayingMedium() {
		return playingMediumSubject.whereIsDefined();
	}

	function observeVolume() {
		return volumeSubject.whereIsDefined();
	}

	function observeMediumPosition() {
		return mediumPositionSubject.whereIsDefined();
	}

	function setMedium(medium) {
		_handlers.setMediumHandler(medium);
	}

	function proceedPendingSettings() {
		pendingList.forEachOwnProperties(function(x) {
			return x.proceed()
		});
	}

	function ReplayBatch() {
		return ;
	}

	function Replay() {
		var _state, _fn, _list;

		return {
			setState: function(state) {
				_state = state;
				return this;
			},
			do: function(fn) {
				_fn = fn;
				return this;
			},
			proceed: function() {
				_fn(_state);
			},
			setQueue: function(queue) {
				_list = queue;
				return this;
			},
			enqueue: function(fn) {
				_list[fn.getName()] = this;
				return this;
			},
			dequeue: function(fn) {
				delete _list[fn.getName()];
				return this;
			}
		}
	}
	Replay.build = function() {
		return new Replay();
	};


	function updateVolume(volume) {
		if (_handlers === null) {
			Replay
				.build()
				.setState(volume)
				.do(function (vol) {
					_handlers.setUpdateVolumeHandler(vol);
				})
				.setQueue(pendingList)
				.dequeue(updateVolume)
				.enqueue(updateVolume);
		} else {
			_handlers.setUpdateVolumeHandler(volume);
		}
		//volumeSubject.onNext(vol);
	}

	function volumeChanged(vol) {
		volumeSubject.onNext(vol);
	}

	function mediumPositionChanged(pos) {
		mediumPositionSubject.onNext(pos);
	}

	//var pendingPosition = null;
	function setMediumPosition(pos) {
		if (_handlers === null) {
			Replay
				.build()
				.setState(pos)
				.do(function (p) {
					_handlers.setMediumPositionHandler(p);
				})
				.setQueue(pendingList)
				.dequeue(setMediumPosition)
				.enqueue(setMediumPosition);
		} else {
			_handlers.setMediumPositionHandler(pos);
		}
		//mediumPositionSubject.onNext(pos);
	}

	//function updatePlayState(state) {
	//	currentStateSubject
	//}

	function playStateChanged(state) {
		currentStateSubject.onNext(state);
	}

	function getAndObservePlayControl() {
		return playControlSubject;
	}

	function playMedium(mediumQueueVm) {
		if (_handlers === null) {
			Replay
				.build()
				.setState(mediumQueueVm)
				.do(function (vm) {
					_handlers.setMediumHandler(vm);
				})
				.setQueue(pendingList)
				.dequeue(playMedium)
				.enqueue(playMedium);
		} else {
			_handlers.setMediumHandler(mediumQueueVm);
		}
		//playingMediumSubject.onNext(mediumQueueVm);
	}

	function setCurrentMedium(mediumQueueVm) {
		playingMediumSubject.onNext(mediumQueueVm);
	}

	function setMediumAndSetCursorAt(mediumQueueVm, position) {
		if (_handlers === null) {
			Replay
				.build()
				.setState([mediumQueueVm, position])
				.do(function (vm) {
					_handlers.setMediumAndSetCursorAt(vm[0], vm[1]);
				})
				.setQueue(pendingList)
				.dequeue(setMediumAndSetCursorAt)
				.enqueue(setMediumAndSetCursorAt);
		} else {
			_handlers.setMediumAndSetCursorAt(mediumQueueVm, position);
		}

		//playingMediumSubject.onNext(mediumQueueVm);
	}

	function playFirst() {
		//commands.playFirstHandler();
		playControlSubject.onNext(PlayerState.PlayFirst);
	}

	function playNext() {
		//commands.playNextHandler();
		playControlSubject.onNext(PlayerState.Next);
	}

	function playPrevious() {
		//commands.playPreviousHandler();
		playControlSubject.onNext(PlayerState.Previous);
	}

	function stop() {
		//commands.stopHandler();
		playControlSubject.onNext(PlayerState.Stop);
	}

	function playEnded() {
		playControlSubject.onNext(PlayerState.Ended);
	}

	function play() {
		//_handlers.playHandler();
		if (_handlers === null) {
			Replay
				.build()
				//.setState([mediumQueueVm, position])
				.do(function () {
					_handlers.playHandler();
				})
				.setQueue(pendingList)
				.dequeue(play)
				.enqueue(play);
		} else {
			_handlers.playHandler();
		}


		playControlSubject.onNext(PlayerState.Play);
	}

	function mediumError() {
		playControlSubject.onNext(PlayerState.Error);
	}

	return {
		init: init,
		observePlayingMedium: observePlayingMedium,
		observeMediumPosition: observeMediumPosition,
		getAndObservePlayControl: getAndObservePlayControl,
		setMediumAndSetCursorAt: setMediumAndSetCursorAt,
		setMedium: setMedium,
		mediumPositionChanged: mediumPositionChanged,
		observeCurrentState: observeCurrentState,
		setMediumPosition: setMediumPosition,
		playStateChanged: playStateChanged,
		//changeState: changeState,
		observeVolume: observeVolume,
		updateVolume: updateVolume,
		volumeChanged: volumeChanged,
		playMedium: playMedium,
		setCurrentMedium: setCurrentMedium,
		//updatePlayState: updatePlayState,
		stop: stop,
		playEnded: playEnded,
		playFirst: playFirst,
		playNext: playNext,
		playPrevious: playPrevious,
		play: play,
		mediumError: mediumError
	}
});