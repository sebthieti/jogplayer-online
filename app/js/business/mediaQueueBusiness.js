'use strict';

jpoApp.factory('mediaQueueBusiness', ['audioPlayerBusiness', 'viewModelBuilder', function(audioPlayerBusiness, viewModelBuilder) {
	var PlayerState = Jpo.PlayerState;

	var currentMediumInQueueSubject = new Rx.BehaviorSubject();
	var mediaQueueSubject = new Rx.BehaviorSubject([]);
	var mediumOnErrorSubject = new Rx.Subject();
	var observeQueueEndedWithMediumSubject = new Rx.Subject();

	audioPlayerBusiness
		.observePlayingMedium()
		.do(function(mediumVm) {
			// Set state: change current media
			currentMediumInQueueSubject.onNext(mediumVm);
		})
		.silentSubscribe();

	audioPlayerBusiness
		.getAndObservePlayControl()
		.do(function(playState) {
			switch (playState) {
				case PlayerState.Error:
					displayMediumErrorResumeNext();
					break;
				case PlayerState.Ended:
				case PlayerState.Next:
					playNext();
					break;
				case PlayerState.Previous:
					playPrevious();
					break;
				case PlayerState.PlayFirst:
					playFirst();
					break;
			}
		})
		.silentSubscribe();

	var displayMediumErrorResumeNext = function() {
		// Notify error playing and try next.
		observeCurrentMediumInQueue().getValueAsync(function (currentMedium) {
			mediumOnErrorSubject.onNext(currentMedium);
			playNext();
		});
	};

	var observeMediumError = function() {
		return mediumOnErrorSubject;
	};

	var playMedium = function(medium) {
		audioPlayerBusiness.playMedium(medium);
	};

	var playNext = function() {
		observeMediaQueueAndCurrentMedium() // TODO Multiple observable creation through calls ?
			.do(function(mediaQueueSet) {
				var currentMediumIndex = mediaQueueSet.mediaViewModelsQueue.indexOf(mediaQueueSet.currentMediumInQueue);
				var isLastElement = currentMediumIndex === mediaQueueSet.mediaViewModelsQueue.length - 1;
				if (isLastElement) {
					observeQueueEndedWithMediumSubject.onNext(mediaQueueSet.currentMediumInQueue);
					return;
				}

				// Check for next media in queue
				var nextMediumIndex = currentMediumIndex + 1;
				var nextMediumViewModelInQueue = mediaQueueSet.mediaViewModelsQueue[nextMediumIndex];

				audioPlayerBusiness.playMedium(nextMediumViewModelInQueue);
			})
			.silentSubscribe();
	};

	var playPrevious = function() {
		observeMediaQueueAndCurrentMedium()
			.do(function(mediaQueueSet) {
				var currentMediumIndex = mediaQueueSet.mediaViewModelsQueue.indexOf(mediaQueueSet.currentMediumInQueue);
				// Check for previous media in queue
				var isFirstMediaInQueue = currentMediumIndex <= 0;
				if (isFirstMediaInQueue) {
					return;
				}

				var previousMediaIndex = currentMediumIndex-1;
				var previousMediaInQueue = mediaQueueSubject.value[previousMediaIndex];

				audioPlayerBusiness.playMedium(previousMediaInQueue);
			})
			.silentSubscribe();
	};

	var onFirstMediumInQueueStartPlay = function() {
		observeMediaQueue()
			.selectWithPreviousValue(function (oldValue, newValue) {
				return oldValue !== null && _.isEmpty(oldValue) && _.any(newValue);
			})
			.where(function (firstTimeQueueFilled) {
				return firstTimeQueueFilled
			})
			.do(function (_) {
				playFirst();
			})
			.silentSubscribe();
	};

	var onLastMediumEndAndNewOneAppendedStartPlay = function() {
		observeMediaQueue()
			.selectWithPreviousValue(function (oldValue, newValue) {
				// TODO Good algorithm ?
				return {
					mediaAdded: oldValue !== null && newValue.length > oldValue.length,
					mediaQueue: newValue
				}
			})
			.where(function(x) {
				return x.mediaAdded })
			.combineLatest( // TODO Optimize this chain
				audioPlayerBusiness
					.getAndObservePlayControl()
					.where(function(playStatus) {
						return playStatus === PlayerState.Ended
					})
				,
				function(mediaQueueSet, playStatus) {
					return {mediaQueueSet: mediaQueueSet, playStatus: playStatus}
				} // TODO rename to getAndObservePlayStatus ?
			)
			.select(function(x) {
				return x.mediaQueueSet.mediaQueue })
			.do(function(newMediaQueue) {
				observeCurrentMediumInQueue().getValueAsync(function(currentMedium) {
					var currentMediumIndex = newMediaQueue.indexOf(currentMedium);

					// Check for next media in queue
					var nextMediumIndex = currentMediumIndex + 1;
					var nextMediumViewModelInQueue = newMediaQueue[nextMediumIndex];

					audioPlayerBusiness.playMedium(nextMediumViewModelInQueue);
				});
			})
			.silentSubscribe();
	};

	var playFirst = function() {
		observeMediaQueue().getValueAsync(function (mediaQueue) {
			if (_.isEmpty(mediaQueue)) {
				return;
			}

			var firstMediumInQueue = mediaQueue[0];
			audioPlayerBusiness.playMedium(firstMediumInQueue);
		});
	};

	var enqueueMediumAndStartQueue = function(mediumModel) {
		var mediumVm = viewModelBuilder.buildQueuedMediumViewModel(mediumModel);
		observeMediaQueue().getValueAsync(function (mediaQueue) {
			var mediaQueueWithMedium = mediaQueue.concat(mediumVm);
			mediaQueueSubject.onNext(mediaQueueWithMedium);
		});
	};

	var enqueueMediaAndStartQueue = function(mediaModels) {
		var mediaVm = mediaModels.map(viewModelBuilder.buildQueuedMediumViewModel);
		observeMediaQueue().getValueAsync(function (mediaQueue) {
			var mediaQueueWithMedia = mediaQueue.concat(mediaVm);
			mediaQueueSubject.onNext(mediaQueueWithMedia);
		});
	};

	var removeMedium = function(medium) {
		observeMediaQueueAndCurrentMedium()
			.do(function(mediaQueueSet) {
				// If medium to remove is current playing...
				if (mediaQueueSet.currentMediumInQueue && mediaQueueSet.currentMediumInQueue === medium) {
					audioPlayerBusiness.stop();
					currentMediumInQueueSubject.onNext(null);
				}
				var updatedMediaQueue = _.filter(mediaQueueSet.mediaViewModelsQueue, function(mediumInQueue) {
					return mediumInQueue !== medium;
				});
				mediaQueueSubject.onNext(updatedMediaQueue);
			})
			.silentSubscribe();
	};

	var observeIsCurrentMediumLast = function() {
		return observeMediaQueueAndCurrentMedium()
			.select(function (mediaQueueSet) {
				var currentMediumIndex = mediaQueueSet.mediaViewModelsQueue.indexOf(mediaQueueSet.currentMediumInQueue);
				var isLastElement = currentMediumIndex === mediaQueueSet.mediaViewModelsQueue.length - 1;
				return isLastElement;
			});
	};

	var observeMediaQueueAndCurrentMedium = function() {
		return observeMediaQueue()
			.asAsyncValue()
			.combineLatest(
				observeCurrentMediumInQueue().asAsyncValue(),
				function(mediaQueue, currentMediumInQueue) {
					return { mediaViewModelsQueue: mediaQueue, currentMediumInQueue: currentMediumInQueue }
				}
			);
	};

	var observeMediaQueue = function() {
		return mediaQueueSubject;
	};

	var observeCurrentMediumInQueue = function() {
		return currentMediumInQueueSubject.whereIsDefined();
	};

	var clearQueue = function() {
		audioPlayerBusiness.stop();
		currentMediumInQueueSubject.onNext(null);
		mediaQueueSubject.onNext([]);
	};

	var observeQueueEndedWithMedium = function() {
		return observeQueueEndedWithMediumSubject;
	};

	onFirstMediumInQueueStartPlay();
	onLastMediumEndAndNewOneAppendedStartPlay();

	return {
		observeMediaQueue: observeMediaQueue,
		observeQueueEndedWithMedium: observeQueueEndedWithMedium,
		enqueueMedium: enqueueMediumAndStartQueue,
		enqueueMedia: enqueueMediaAndStartQueue,
		playMedium: playMedium,
		removeMedium: removeMedium,
		clearQueue: clearQueue,
		playNext: playNext,
		playPrevious: playPrevious,
		observeCurrentMediumInQueue: observeCurrentMediumInQueue,
		observeIsCurrentMediumLast: observeIsCurrentMediumLast,
		observeMediumError: observeMediumError
	}
}]);