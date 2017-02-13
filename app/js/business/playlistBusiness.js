'use strict';

jpoApp.factory('playlistBusiness', [
	'$q',
	'mediaQueueBusiness',
	'audioService',
	'PlaylistsModel',
	'PlaylistMediaModel',
	'viewModelBuilder',
	'authBusiness',
	function($q, mediaQueueBusiness, audioService, PlaylistsModel, PlaylistMediaModel, viewModelBuilder, authBusiness) {
		var playlistViewModelsSubject = new Rx.BehaviorSubject();
		var playingPlaylistSubject = new Rx.BehaviorSubject();
		var playingMediumSubject = new Rx.BehaviorSubject();
		var currentPlaylistSubject = new Rx.BehaviorSubject();

		// React on ended or next (when there's a need to change medium)
		// Get 'is current medium last' of queue
		// If it is, then get the latest one
		// If the last one is a medium from a playlist, then play next automagically

		mediaQueueBusiness
			.observeQueueEndedWithMedium()
			.where(function(lastMediumInQueueViewModel) { // React only if current playing medium is a medium from playlist
				return angular.isDefined(lastMediumInQueueViewModel.model.id)
			})
			.do(function(lastMediumInQueueViewModel) {
				playNext(lastMediumInQueueViewModel);
			})
			.silentSubscribe();

		loadPlaylistsOnUserLogon();
		clearPlaylistsOnUserLogoff();

		function observePlayingMedium() {
			return playingMediumSubject.whereIsDefined();
		}

		function findMediumFromOtherViewModelAsAsyncValue(playingMediumViewModel) {
			return Rx.Observable.create(function(observer) {
				if (!playingMediumViewModel || !angular.isDefined(playingMediumViewModel.model.id)) {
					return;
				}

				var playingMediumId = playingMediumViewModel.model.id;
				observePlayingPlaylist().getValueAsync(function(playingPlaylist) {
					var mediumVm = _.find(playingPlaylist.media, function(mediumVm) {
						return mediumVm.model.id === playingMediumId;
					});

					observer.onNext(mediumVm);
					observer.onCompleted();
				});
			});
		}

		audioService
			.observePlayingMedium()
			.whereIsNotNull()
			.do(function(currentMediumViewModel) {
				// Is medium from playlist of file system ?
				if (!currentMediumViewModel.model.playlistId) {
					playingPlaylistSubject.onNext(null);
					return;
				}
				observePlaylistViewModels().getValueAsync(function(playlistViewModels) {
					var playingPlaylist = _.find(playlistViewModels, function(playlistViewModel) {
						return playlistViewModel.model.id === currentMediumViewModel.model.playlistId;
					});
					playingPlaylistSubject.onNext(playingPlaylist);

					var currentMedium = findMediumFromOtherViewModelAsAsyncValue(currentMediumViewModel);
					playingMediumSubject.onNext(currentMedium);
				});
			})
			.silentSubscribe();

		function playNext(currentMediumInQueueViewModel) {
			var currentMediumId = currentMediumInQueueViewModel.model.id;
			observePlayingPlaylist().getValueAsync(function(playingPlaylist) {
				var currentMediumVm = _.find(playingPlaylist.media, function(mediumVm) {
					return mediumVm.model.id === currentMediumId;
				});

				var currentMediumIndex = currentMediumVm.model.index;
				// If current ended medium isn't last from playlist, then play it
				if (currentMediumIndex < playingPlaylist.media.length - 1) {
					// take next
					var nextMedium = playingPlaylist.media[currentMediumIndex+1];
					mediaQueueBusiness.enqueueMediumAndStartQueue(nextMedium.model);
				}
			});
		}

		function observePlaylistViewModels() {
			return playlistViewModelsSubject.whereIsDefined();
		}

		function observePlayingPlaylist() {
			return playingPlaylistSubject.whereIsDefined();
		}

		function observeCurrentPlaylist() {
			return currentPlaylistSubject.whereIsDefined();
		}

		function loadPlaylistsOnUserLogon() {
			authBusiness
				.observeCurrentUserAuthentication()
				.whereHasValue()
				.do(function() {
					PlaylistsModel
						.getAsync()
						.then(function(playlists) {
							return playlists.map(viewModelBuilder.buildEditableViewModel)
						})
						.then(function (playlistViewModels) {
							playlistViewModelsSubject.onNext(playlistViewModels);
						});
				})
				.silentSubscribe();
		}

		function clearPlaylistsOnUserLogoff() {
			authBusiness
				.observeCurrentUserAuthentication()
				.whereIsNull()
				.do(function() {
					playlistViewModelsSubject.onNext(null);
				})
				.silentSubscribe();
		}

		function playlistSelected(playlistViewModel) {
			if (playlistViewModel.media) {
				currentPlaylistSubject.onNext(playlistViewModel);
				return $q.when(playlistViewModel.media);
			}
			return loadMediaAsync(playlistViewModel.model)
				.then(function(media) {
					//$timeout(function() {
						playlistViewModel.media = media.map(viewModelBuilder.buildMediumViewModel);
						currentPlaylistSubject.onNext(playlistViewModel);
					//});

				});
		}

		function selectPlaylistByIdAsync(playlistId) {
			return $q(function(resolve, reject) {
				observePlaylistViewModels().getValueAsync(function (playlistVms) {
					var vm = _.find(playlistVms, function(vm) {
						return vm.model.id === playlistId;
					});

					if (vm) {
						playlistSelected(vm).then(function() {
							resolve(vm);
						});
					} else {
						reject('Playlist not found:' + playlistId);
					}
				});
			});
		}

		function loadMediaAsync(playlistModel) {
			return PlaylistMediaModel.getMediaFrom(playlistModel);
		}

		function addVirtualPlaylistAsync(playlist){
			return PlaylistsModel
				.addAsync(playlist)
				.then(function(playlist) {
					return viewModelBuilder.buildEditableViewModel(playlist)
				})
				.then(function (newPlaylistViewModel) {
					observePlaylistViewModels().getValueAsync(function (playlistViewModels) {
						playlistViewModelsSubject.onNext(playlistViewModels.concat(newPlaylistViewModel));
					});
					//playlistChangeSubject.onNext({
					//	entity: playlist.toArray(),
					//	status: EntityStatus.Added
					//});
				});
		}

		function addPhysicalPlaylistsByFilePathsAsync(playlistFiles){ // TODO Test when fileEx turns to model
			Rx.Observable
				.fromArray(playlistFiles) // playlistsFilePaths
				.select(function(playlistFile) {
					return Rx.Observable.fromPromise(PlaylistsModel.addByFilePathAsync(playlistFile.model));
				})
				.selectMany(function(rx) { return rx })
				.toArray()
				.select(function(addedPlaylists) { // toPlaylistsViewModel
					return addedPlaylists.map(viewModelBuilder.buildEditableViewModel);
				})
				.do(function(addedPlaylistViewModels) {
					observePlaylistViewModels().getValueAsync(function (playlistViewModels) {
						playlistViewModelsSubject.onNext(playlistViewModels.concat(addedPlaylistViewModels));
					});
					//playlistChangeSubject.onNext({
					//	entity: playlist.toArray(),
					//	status: EntityStatus.Added
					//});
				})
				.silentSubscribe();
		}

		function updatePlaylistAsync(playlistModel){
			return playlistModel.updateAsync();
			//playlistChangeSubject.onNext({
			//	entity: updatedPlaylist.toArray(),
			//	status: EntityStatus.Updated
			//});
		}

		function removeMediumFromPlaylist(mediumToRemove){
			Rx.Observable
				.fromPromise(mediumToRemove.removeAsync())
				.selectMany(function() { return observeCurrentPlaylist().asAsyncValue() })
				.do(function(currentPlaylist) {
					var mediaArrayUpdated = removeMediumFromArray(currentPlaylist.media, mediumToRemove);
					mediaArrayUpdated = remapIndexes(mediaArrayUpdated);
					currentPlaylist.media = mediaArrayUpdated;

					//mediaChangeSubject.onNext({
					//	entity: mediumToRemove.toArray(),
					//	status: EntityStatus.Removed
					//});
				})
				.silentSubscribe();
		}

		function removeMediumFromArray(mediaArray, mediumToRemove) {
			return _.filter(mediaArray, function(medium) {
				return medium.model.id !== mediumToRemove.id;
			});
		}

		function removePlaylistAsync(playlist){
			return playlist
				.removeAsync()
				.then(function() {
					observePlaylistViewModels().getValueAsync(function (playlistViewModels) {
						playlistViewModels = removePlaylist(playlistViewModels, playlist);
						playlistViewModels = remapIndexes(playlistViewModels);
						playlistViewModelsSubject.onNext(playlistViewModels);

						observeCurrentPlaylist().getValueAsync(function (currentPlaylistVm) {
							if (currentPlaylistVm.model.id === playlist.id) {
								// Reset current playlist if it was the current one.
								currentPlaylistSubject.onNext(null);
							}
						});
					});
					//playlistChangeSubject.onNext({
					//	entity: playlist.toArray(),
					//	status: EntityStatus.Removed
					//});
				});
		}

		function removePlaylist(playlists, playlist) {
			return _.filter(playlists, function(pl) {
				return pl.model.id !== playlist.id;
			});
		}

		function remapIndexes(elements) {
			var elIndex = 0;
			_.each(elements, function(elm) {
				elm.model.index = elIndex;
				elIndex++;
			});
			return elements;
		}

		function playMedium(mediumViewModel){
			mediaQueueBusiness.enqueueMediumAndStartQueue(mediumViewModel.model);
		}

		function addFilesToSelectedPlaylist(fileViewModels) {
			observeCurrentPlaylist()
				.asAsyncValue()
				.whereHasValue()
				.do(function(selectedPlaylistViewModel) {
					var mediaFilePathPromises = fileViewModels.map(function(fileVm, index) {
						var mediaFilePath = fileVm.model.selectSelfPhysicalFromLinks();
						return selectedPlaylistViewModel
							.model
							.insertMediumByFilePathToPlaylist(
								mediaFilePath,
								index
							);
					});
					$q.all(mediaFilePathPromises)
					.then(function(mediaFilePaths) {
						selectedPlaylistViewModel.media = selectedPlaylistViewModel.media.concat(
							mediaFilePaths.map(viewModelBuilder.buildMediumViewModel)
						);
						observeCurrentPlaylist().getValueAsync(function (currentPlaylistVm) {
							// Reset current playlist if it was the current one.
							if (currentPlaylistVm.model.id === selectedPlaylistViewModel.model.id) {
								currentPlaylistSubject.onNext(currentPlaylistVm);
							}
						});
					});
				})
				.silentSubscribe();
		}

		return {
			observePlayingMedium: observePlayingMedium,
			//loadPlaylists: loadPlaylistsOnUserLogon,
			observePlaylistViewModels: observePlaylistViewModels,
			playlistSelected: playlistSelected,
			selectPlaylistByIdAsync: selectPlaylistByIdAsync,
			updatePlaylistAsync: updatePlaylistAsync,
			removePlaylistAsync: removePlaylistAsync,
			addVirtualPlaylistAsync: addVirtualPlaylistAsync,
			addPhysicalPlaylistsByFilePathsAsync: addPhysicalPlaylistsByFilePathsAsync,
			addFilesToSelectedPlaylist: addFilesToSelectedPlaylist,
			removeMediumFromPlaylist: removeMediumFromPlaylist,
			playMedium: playMedium,
			observeCurrentPlaylist: observeCurrentPlaylist
		}
	}
]);