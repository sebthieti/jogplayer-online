'use strict';

jpoApp.factory('userStateBusiness', [
	'$q',
	'audioPlayerBusiness',
	'authBusiness',
	'mediaQueueBusiness',
	'fileExplorerBusiness',
	'playlistBusiness',
	'PlaylistMediaModel',
	'FileModel',
	'UserStateModel',
	function($q, audioPlayerBusiness, authBusiness, mediaQueueBusiness, fileExplorerBusiness, playlistBusiness, PlaylistMediaModel, FileModel, UserStateModel) {
		var userStateSubject = new Rx.BehaviorSubject();
		//var PlayerState = Jpo.PlayerState;

		function observeUserState() {
			return userStateSubject;
		}

		function loadStateOnUserAuthenticated(){ // TODO Move to service
			authBusiness
				.observeAuthenticatedUser()
				.whereHasValue()
				.do(function(__) {
					audioPlayerBusiness.updateVolume(tryLoadVolumeState());

					UserStateModel
						.getCurrentUserStateAsync()
						.then(function(userState) {
							userStateSubject.onNext(userState);
							if (!userState) {
								return;
							}

							loadMediaQueueAsync(userState)
								.then(function() {
									return loadCurrentMediumAsync(userState);
								});
							loadCurrentPlaylist(userState);
						});
				})
				.silentSubscribe();
		}

		function loadCurrentPlaylist(userState) {
			return playlistBusiness.selectPlaylistByIdAsync(userState.openedPlaylistId);
		}

		function loadMediaQueueAsync(userState) {
			var deferred = $q.defer();

			var mediaInQueuePromises = userState.mediaQueue.map(function(mediumLinkUrl) {
				if (mediumLinkUrl.startsWith('/api/playlists/')) {
					return PlaylistMediaModel.getMediumFromLinkUrl(mediumLinkUrl);
				} else {
					return FileModel.getMediumFromLinkUrl(mediumLinkUrl);
				}
			});
			$q.all(mediaInQueuePromises)
				.then(function(mediaInQueue) {
					return mediaQueueBusiness.enqueueMediaAndStartQueue(mediaInQueue);
				})
				.then(function() {
					deferred.resolve();
				});

			return deferred.promise;
		}

		function loadCurrentMediumAsync(userState) {
			// Search medium at index
			return mediaQueueBusiness
				.getMediumVmAtIndexAsync(userState.playingMediumInQueueIndex)
				.then(function(mediumInQueueVm) {
					//audioPlayerBusiness.playMedium(mediumInQueueVm);
					if (mediumInQueueVm) {
						audioPlayerBusiness.setMediumAndSetCursorAt(mediumInQueueVm, userState.playedPosition);
					}
				});
		}

		function observeMediumQueueSelectLinkUrl() {
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

		function observeMediaVolumeChange() {
			return authBusiness
				.observeAuthenticatedUser()
				.whereIsNotNull() // TODO Stop when user disconnect
				.selectMany(function() {
					return audioPlayerBusiness
						.observeVolume()
						.debounce(500);
				});
		}

		function observeMediumPositionChangeByInterval(interval){
			return authBusiness
				.observeAuthenticatedUser()
				.whereIsNotNull() // TODO Stop when user disconnect
				.select(function() {
					return Rx.Observable
						.timer(interval, interval)
						.withLatestFrom(
							audioPlayerBusiness.observeMediumPosition(),
							function(t, m) { return m }
						)
						.distinctUntilChanged(function(x) { return x });
				})
				.selectMany(function(x) { return x });
		}

		function observeFileExplorerPathChangeByInterval(interval) {
			return authBusiness
				.observeAuthenticatedUser()
				.whereIsNotNull() // TODO Stop when user disconnect
				.select(function() {
					return Rx.Observable
						.timer(interval, interval)
						.withLatestFrom(
							fileExplorerBusiness.observeCurrentFolderContent(),
							function(t, m) { return m.selectSelfFromLinks() }
						)
						.distinctUntilChanged(function(x) { return x });
				})
				.selectMany(function(x) { return x });
		}

		function observePlaylistSelectionChangeByInterval(interval) {
			return authBusiness
				.observeAuthenticatedUser()
				.whereIsNotNull() // TODO Stop when user disconnect
				.select(function() {
					return Rx.Observable
						.timer(interval, interval)
						.withLatestFrom(
							playlistBusiness.observeCurrentPlaylist(),
							function(t, m) { return m }
						)
						.distinctUntilChanged(function(x) { return x });
				})
				.selectMany(function(x) { return x });
		}

		function observeCurrentMediumIndexInQueue() {
			return mediaQueueBusiness.observeCurrentMediumIndexInQueue();
		}

		function observeControlsForStateChange() {
			return Rx.Observable.combineLatest(
				observeMediumPositionChangeByInterval(5000),
				observePlaylistSelectionChangeByInterval(5000),
				observeFileExplorerPathChangeByInterval(5000),
				observeMediumQueueSelectLinkUrl(),
				observeCurrentMediumIndexInQueue(),
				function (mediumPosition, currentPlaylistVm, currentFileExplorerPath, mediumQueueLinks, playingMediumInQueueIndex) {
					return {
						playedPosition: mediumPosition,
						currentPlaylistVm: currentPlaylistVm,
						currentFileExplorerPath: currentFileExplorerPath,
						mediaQueueLinks: mediumQueueLinks,
						playingMediumInQueueIndex: playingMediumInQueueIndex
					}
				}
			);
		}

		function onControlsStateChangeUpdate() {
			observeMediaVolumeChange()
				.do(function(vol) {
					tryStoreVolumeState(vol);
				})
				.silentSubscribe();

			observeControlsForStateChange()
				.do(function (controlsStates) {
					observeUserState().getValueAsync(function(userState) {
						if (userState) { // Just update
							userState.playedPosition = controlsStates.playedPosition;
							userState.mediaQueue = controlsStates.mediaQueueLinks;
							userState.playingMediumInQueueIndex = controlsStates.playingMediumInQueueIndex;
							userState.openedPlaylistId = controlsStates.currentPlaylistVm.model.id;
							userState.browsingFolderPath = controlsStates.currentFileExplorerPath;
							userState.updateAsync();

						} else { // Insertion
							var newUserState = UserStateModel
								.createEmptyUserStateEntity()
								.setMediaQueue(controlsStates.mediaQueueLinks)
								.setPlayedPosition(controlsStates.playedPosition)
								.setBrowsingFolderPath(controlsStates.currentFileExplorerPath)
								.setPlayingMediumInQueueIndex(controlsStates.playingMediumInQueueIndex)
								.setOpenedPlaylistId(controlsStates.currentPlaylistVm.model.id);
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

		function tryStoreVolumeState(volume) {
			if(typeof(Storage) !== "undefined") {
				// Code for localStorage/sessionStorage.
				localStorage.setItem('state', JSON.stringify({ volume: volume }));
			}
		}

		function tryLoadVolumeState() {
			if(typeof(Storage) !== "undefined") {
				// Code for localStorage/sessionStorage.
				var state = JSON.parse(localStorage.getItem('state'));
				if (state) {
					return state.volume
				}
				return 0;
			}
		}

		loadStateOnUserAuthenticated();
		onControlsStateChangeUpdate();

		return { // TODO give init method
			//saveUserState: saveUserState
		}
}]);