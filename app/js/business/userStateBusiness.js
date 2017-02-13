'use strict';

jpoApp.factory('userStateBusiness', [
	'$q',
	'audioPlayerBusiness',
	'authBusiness',
	'mediaQueueBusiness',
	'PlaylistMediaModel',
	'FileModel',
	'UserStateModel',
	function($q, audioPlayerBusiness, authBusiness, mediaQueueBusiness, PlaylistMediaModel, FileModel, UserStateModel) {
		var userStateSubject = new Rx.BehaviorSubject();

		function observeUserState() {
			return userStateSubject;
		}

		function loadStateOnUserAuthenticated(){ // TODO Move to service
			authBusiness
				.observeAuthenticatedUser()
				.asAsyncValue()
				.do(function(__) {
					UserStateModel
						.getCurrentUserStateAsync()
						.then(function(userState) {
							userStateSubject.onNext(userState);
							if (!userState) {
								return;
							}

							var mediaInQueuePromises = userState.mediaQueue.map(function(mediumLinkUrl) {
								if (mediumLinkUrl.startsWith('/api/playlists/')) {
									return PlaylistMediaModel.getMediumFromLinkUrl(mediumLinkUrl);
								} else {
									return FileModel.getMediumFromLinkUrl(mediumLinkUrl);
								}
							});
							$q.all(mediaInQueuePromises)
								.then(function(mediaInQueue) {
									mediaQueueBusiness.enqueueMedia(mediaInQueue);
								});
						});
				})
				.silentSubscribe();
		}

		function observeMediaQueueSelectLinkUrl() {
			return mediaQueueBusiness
				.observeMediaQueue()
				.selectWithPreviousValue(function(oldValue, newValue) {
					return { oldValue: oldValue, newValue: newValue }
				})
				.where(function(values) {
					return !((values.oldValue === null) && (values.newValue === null)) &&
						!(!_.any(values.oldValue) && !_.any(values.newValue)); // TODO Revamp
				})
				.select(function(values) {return values.newValue})
				.select(function(mediaQueue) {
					return mediaQueue.map(function(mediumInQueue) {
						return mediumInQueue.model.selectSelfFromLinks();
					})
				});
		}

		function observeMediaPositionChangeByInterval(interval){
			return Rx.Observable
				.timer(interval, interval)
				.select(function() {return audioPlayerBusiness.getMediumPosition()})
				.distinctUntilChanged(function(x) {return x});
		}

		function observeControlsForStateChange() {
			return Rx.Observable.combineLatest(
				observeMediaPositionChangeByInterval(10000).select(function(x) {
					return x;
				}),
				observeMediaQueueSelectLinkUrl().select(function(x) {
					return x;
				}),
				function (mediumPosition, mediaQueueLinks) {
					return {
						playedPosition: mediumPosition,
						mediaQueueLinks: mediaQueueLinks
					}
				}
			);
		}

		function onControlsStateChangeUpdate() {
			observeControlsForStateChange()
				.do(function (controlsStates) {
					observeUserState().getValueAsync(function(userState) {
						if (userState) { // Just update
							userState.playedPosition = controlsStates.playedPosition;
							userState.mediaQueue = controlsStates.mediaQueueLinks;
							userState.updateAsync();
						} else { // Insertion
							var newUserState = UserStateModel
								.createEmptyUserStateEntity()
								.setMediaQueue(controlsStates.mediaQueueLinks)
								.setPlayedPosition(controlsStates.playedPosition);
							UserStateModel
								.addAsync(newUserState)
								.then(function (userState) {
									userStateSubject.onNext(userState);
								}); // TODO PB 2 calls are made: 1 for add, other for update
						}
					});
				})
				.silentSubscribe();
		}

		loadStateOnUserAuthenticated();
		onControlsStateChangeUpdate();

		return { // TODO give init method
			//saveUserState: saveUserState
		}
}]);