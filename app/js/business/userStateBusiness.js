'use strict';

jpoApp.factory('userStateBusiness', [
	'$q',
	'mediators',
	'audioService',
	'authBusiness',
	'mediaQueueBusiness',
	'fileExplorerBusiness',
	'playlistBusiness',
	'PlaylistMediaModel',
	'FileModel',
	'UserStateModel',
	function($q, mediators, audioService, authBusiness, mediaQueueBusiness, fileExplorerBusiness, playlistBusiness, PlaylistMediaModel, FileModel, UserStateModel) {
		var userStateSubject = new Rx.BehaviorSubject();
		//var PlayerState = Jpo.PlayerState;
		var initializingState = false;

		function observeUserState() {
			return userStateSubject;
		}

		function loadStateOnUserAuthenticated(){ // TODO Move to service
			authBusiness
				.observeAuthenticatedUser()
				.whereHasValue()
				.do(function(__) {
					var vol = tryLoadVolumeState() || 1.0;
					audioService.setVolume(vol);

					UserStateModel
						.getCurrentUserStateAsync()
						.then(function(userState) {
							initializingState = true;
							mediators.setIsUserStateInitialized(initializingState);
							userStateSubject.onNext(userState);
							if (!userState) {
								initializingState = false;
								mediators.setIsUserStateInitialized(initializingState);
								return;
							}

							$q.all([
								loadMediaQueueAsync(userState)
									.then(function() {
										return loadCurrentMediumAsync(userState);
									}),
								loadCurrentPlaylist(userState)
							]).then(function() {
								initializingState = false;
								mediators.setIsUserStateInitialized(initializingState);
							}, function() {
								initializingState = false;
								mediators.setIsUserStateInitialized(initializingState);
							});
						});
				})
				.silentSubscribe();
		}

		function loadCurrentPlaylist(userState) {
			if (!userState.openedPlaylistId) {
				return $q.when({});
			}
			return playlistBusiness.selectPlaylistByIdAsync(userState.openedPlaylistId);
		}

		function loadMediaQueueAsync(userState) {
			var mediaInQueuePromises = (userState.mediaQueue || []).map(function(mediumLinkUrl) {
				if (mediumLinkUrl.startsWith('/api/playlists/')) {
					return PlaylistMediaModel.getMediumFromLinkUrl(mediumLinkUrl);
				} else {
					return FileModel
						.getMediumFromLinkUrl(mediumLinkUrl)
						.catch(function(err) {
							// TODO In the future enhance error handling
							return FileModel.createEntity(mediumLinkUrl);
						});
				}
			});

			return $q.all(mediaInQueuePromises)
				.then(function(mediaInQueue) { // Si un medium fail, ne laisser que le nom
					return mediaQueueBusiness.enqueueMediaAndStartQueue(mediaInQueue);
				}, function(err) {
					console.log(err)
				});
		}

		function loadCurrentMediumAsync(userState) {
			// Search medium at index
			return mediaQueueBusiness
				.getMediumVmAtIndexAsync(userState.playingMediumInQueueIndex)
				.then(function(mediumInQueueVm) {
					if (mediumInQueueVm) {
						// TODO Move the following to audioService ?
						audioService
							.setMediumToPlayAsync(mediumInQueueVm)
							.then(function() {
								audioService.setMediumPositionByTime(userState.playedPosition);
								//audioService.playOrPause();
							});
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
					return audioService
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
							audioService
								.observeTimeUpdate()
								.select(function (value) { return value.currentTime }),
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
				observeMediumPositionChangeByInterval(5000)
					.startWith(null).select(function(x) {
						return x;
					}),
				observePlaylistSelectionChangeByInterval(5000)
					.startWith(null).select(function(x) {
						return x;
					}),
				observeFileExplorerPathChangeByInterval(5000)
					.startWith(null).select(function(x) {
						return x;
					}),
				observeMediumQueueSelectLinkUrl().
					startWith(null).select(function(x) {
						return x;
					}),
				observeCurrentMediumIndexInQueue()
					.startWith(null).select(function(x) {
						return x;
					}),
				function (mediumPosition, currentPlaylistVm, currentFileExplorerPath, mediumQueueLinks, playingMediumInQueueIndex) {
					return {
						playedPosition: mediumPosition,
						currentPlaylistVm: currentPlaylistVm,
						currentFileExplorerPath: currentFileExplorerPath,
						mediaQueue: mediumQueueLinks,
						playingMediumInQueueIndex: playingMediumInQueueIndex
					}
				}
			)
			.where(function() {
				return !initializingState;
			});
		}

		function onControlsStateChangeUpdate() {
			observeMediaVolumeChange()
				.do(function(vol) {
					tryStoreVolumeState(vol);
				})
				.silentSubscribe();

			observeControlsForStateChange()
				.where(function(controlsState) {
					return !(controlsState.playedPosition === null &&
						controlsState.currentPlaylistVm === null &&
						controlsState.currentFileExplorerPath === null &&
						controlsState.mediaQueue === null &&
						controlsState.playingMediumInQueueIndex === null);
				})
				.do(function (controlsStates) {
					observeUserState().getValueAsync(function(userState) {
						var plId = controlsStates.currentPlaylistVm
							? controlsStates.currentPlaylistVm.model.id
							: null;
						if (userState) { // Just update
							userState.playedPosition = controlsStates.playedPosition;
							userState.mediaQueue = controlsStates.mediaQueue;
							userState.playingMediumInQueueIndex = controlsStates.playingMediumInQueueIndex;
							userState.openedPlaylistId = plId;
							userState.browsingFolderPath = controlsStates.currentFileExplorerPath;
							userState
								.updateAsync()
								.then(function(updatedState) {
									userStateSubject.onNext(updatedState);
								});
						} else { // Insertion
							var newUserState = UserStateModel
								.createEmptyUserStateEntity()
								.setMediaQueue(controlsStates.mediaQueue)
								.setPlayedPosition(controlsStates.playedPosition)
								.setBrowsingFolderPath(controlsStates.currentFileExplorerPath)
								.setPlayingMediumInQueueIndex(controlsStates.playingMediumInQueueIndex)
								.setOpenedPlaylistId(plId);
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

		return {
			init: function() {
				loadStateOnUserAuthenticated();
				onControlsStateChangeUpdate();
			}
		}
}]);
