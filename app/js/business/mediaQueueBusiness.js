'use strict';

jpoApp.factory('mediaQueueBusiness', [
	'$q',
	'audioPlayerBusiness',
	'authBusiness',
	'viewModelBuilder',
	function($q, audioPlayerBusiness, authBusiness, viewModelBuilder) {
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

	clearUsersOnUserLogoff();

	function clearUsersOnUserLogoff() {
		authBusiness
			.observeCurrentUserAuthentication()
			.whereIsNull()
			.do(function() {
				mediaQueueSubject.onNext([]);
			})
			.silentSubscribe();
	}

	function displayMediumErrorResumeNext() {
		// Notify error playing and try next.
		observeCurrentMediumInQueue().getValueAsync(function (currentMedium) {
			mediumOnErrorSubject.onNext(currentMedium);
			playNext();
		});
	}

	function observeMediumError() {
		return mediumOnErrorSubject;
	}

	function playMedium(mediumVm) {
		audioPlayerBusiness.playMedium(mediumVm);
	}

	function getMediumVmAtIndexAsync(index) {
		var deferred = $q.defer();
		observeMediaQueue().getValueAsync(function (mediaQueue) {
			var vm = mediaQueue[index];
			deferred.resolve(vm);
		});
		return deferred.promise;
	}

	function playNext() {
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
	}

	function playPrevious() {
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
	}

	function onFirstMediumInQueueStartPlay() {
		observeMediaQueue()
			.whereHasValue()
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
	}

	function onLastMediumEndAndNewOneAppendedStartPlay() {
		observeMediaQueue()
			.whereHasValue()
			.selectWithPreviousValue(function (oldValue, newValue) {
				// TODO Good algorithm ?
				return {
					mediaAdded: oldValue !== null && newValue.length > oldValue.length,
					mediaQueue: newValue
				}
			})
			.where(function(x) { return x.mediaAdded })
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
	}

	function playFirst() {
		observeMediaQueue().getValueAsync(function (mediaQueue) {
			if (_.isEmpty(mediaQueue)) {
				return;
			}

			var firstMediumInQueue = mediaQueue[0];
			audioPlayerBusiness.playMedium(firstMediumInQueue);
		});
	}

	function enqueueMediumAndStartQueue(mediumModel) {
		var mediumVm = viewModelBuilder.buildQueuedMediumViewModel(mediumModel);
		observeMediaQueue().getValueAsync(function (mediaQueue) {
			var mediaQueueWithMedium = mediaQueue.concat(mediumVm);
			mediaQueueSubject.onNext(mediaQueueWithMedium);
		});
	}

	function enqueueMediaAndStartQueue(mediaModels) {
		var deferred = $q.defer();

		var mediaVm = mediaModels.map(viewModelBuilder.buildQueuedMediumViewModel);
		observeMediaQueue().getValueAsync(function (mediaQueue) {
			var mediaQueueWithMedia = mediaQueue.concat(mediaVm);
			mediaQueueSubject.onNext(mediaQueueWithMedia);

			deferred.resolve();
		});

		return deferred.promise;
	}

	function removeMedium(medium) {
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
	}

	function observeIsCurrentMediumLast() {
		return observeMediaQueueAndCurrentMedium()
			.select(function (mediaQueueSet) {
				var currentMediumIndex = mediaQueueSet.mediaViewModelsQueue.indexOf(mediaQueueSet.currentMediumInQueue);
				var isLastElement = currentMediumIndex === mediaQueueSet.mediaViewModelsQueue.length - 1;
				return isLastElement;
			});
	}

	function observeMediaQueueAndCurrentMedium() {
		return observeMediaQueue()
			.asAsyncValue()
			.combineLatest(
				observeCurrentMediumInQueue().asAsyncValue(),
				function(mediaQueue, currentMediumInQueue) {
					return { mediaViewModelsQueue: mediaQueue, currentMediumInQueue: currentMediumInQueue }
				}
			);
	}

	function observeCurrentMediumInQueue() {
		return currentMediumInQueueSubject.whereIsDefined();
	}

	function observeCurrentMediumIndexInQueue() {
		return observeMediaQueue()
			.combineLatest(
				observeCurrentMediumInQueue(),
				function(mediaQueue, currentMediumInQueue) {
					return mediaQueue.indexOf(currentMediumInQueue);
				}
			);
	}

	function observeMediaQueue() {
		return mediaQueueSubject;
	}

	function clearQueue() {
		audioPlayerBusiness.stop();
		currentMediumInQueueSubject.onNext(null);
		mediaQueueSubject.onNext([]);
	}

	function observeQueueEndedWithMedium() {
		return observeQueueEndedWithMediumSubject;
	}

	//onFirstMediumInQueueStartPlay();
	onLastMediumEndAndNewOneAppendedStartPlay();

	return {
		observeMediaQueue: observeMediaQueue,
		observeQueueEndedWithMedium: observeQueueEndedWithMedium,
		enqueueMediumAndStartQueue: enqueueMediumAndStartQueue,
		enqueueMediaAndStartQueue: enqueueMediaAndStartQueue,
		playMedium: playMedium,
		removeMedium: removeMedium,
		clearQueue: clearQueue,
		playNext: playNext,
		playPrevious: playPrevious,
		getMediumVmAtIndexAsync: getMediumVmAtIndexAsync,
		observeCurrentMediumInQueue: observeCurrentMediumInQueue,
		observeCurrentMediumIndexInQueue: observeCurrentMediumIndexInQueue,
		observeIsCurrentMediumLast: observeIsCurrentMediumLast,
		observeMediumError: observeMediumError
	}
}]);