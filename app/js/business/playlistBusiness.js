'use strict';

jpoApp.factory('playlistBusiness', [
	'$q',
	'mediaQueueBusiness',
	'audioPlayerBusiness',
	'PlaylistsModel',
	'PlaylistMediaModel',
	'viewModelBuilder',
	'authBusiness',
	function($q, mediaQueueBusiness, audioPlayerBusiness, PlaylistsModel, PlaylistMediaModel, viewModelBuilder, authBusiness) {
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

		var observePlayingMedium = function() {
			return playingMediumSubject.whereIsDefined();
		};

		var findMediumFromOtherViewModelAsAsyncValue = function(playingMediumViewModel) {
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
		};

		audioPlayerBusiness
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

		var playNext = function(currentMediumInQueueViewModel) {
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
					mediaQueueBusiness.enqueueMedium(nextMedium.model);
				}
			});
		};

		var observePlaylistViewModels = function() {
			return playlistViewModelsSubject.whereIsDefined();
		};

		var observePlayingPlaylist = function() {
			return playingPlaylistSubject.whereIsDefined();
		};

		var observeCurrentPlaylist = function() {
			return currentPlaylistSubject.whereIsDefined();
		};

		var loadPlaylists = function () {
			authBusiness
				.observeAuthenticatedUser()
				.asAsyncValue()
				.do(function(__) {

					PlaylistsModel
						.getAllAsync()
						.then(function(playlists) {
							return playlists.map(viewModelBuilder.buildEditableViewModel)
						})
						.then(function (playlistViewModels) {
							playlistViewModelsSubject.onNext(playlistViewModels);
						});

				})
				.silentSubscribe();

		};

		var playlistSelected = function(playlistViewModel) {
			if (playlistViewModel.media) {
				currentPlaylistSubject.onNext(playlistViewModel);
				var deferred = $q.defer();
				deferred.resolve(playlistViewModel.media);
				return deferred.promise;
			}
			return loadMediaAsync(playlistViewModel.model)
				.then(function(media) {
					playlistViewModel.media = media.map(viewModelBuilder.buildMediumViewModel);
					currentPlaylistSubject.onNext(playlistViewModel);
				});
		};

		var loadMediaAsync = function(playlistModel) {
			return PlaylistMediaModel.getMediaFrom(playlistModel);
		};

		var addVirtualPlaylistAsync = function(playlist){
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
		};

		var addPhysicalPlaylistsByFilePathsAsync = function(playlistFiles){ // TODO Test when fileEx turns to model
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
		};

		var updatePlaylistAsync = function(playlistModel){
			return playlistModel.updateAsync();
			//playlistChangeSubject.onNext({
			//	entity: updatedPlaylist.toArray(),
			//	status: EntityStatus.Updated
			//});
		};

		var removeMediumFromPlaylist = function(mediumToRemove){
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
		};

		var removeMediumFromArray = function(mediaArray, mediumToRemove) {
			return _.filter(mediaArray, function(medium) {
				return medium.model.id !== mediumToRemove.id;
			});
		};

		var removePlaylistAsync = function(playlist){
			return playlist
				.removeAsync()
				.then(function() {
					observePlaylistViewModels().getValueAsync(function (playlistViewModels) {
						playlistViewModels = removePlaylist(playlistViewModels, playlist);
						playlistViewModels = remapIndexes(playlistViewModels);
						playlistViewModelsSubject.onNext(playlistViewModels);
					});
					//playlistChangeSubject.onNext({
					//	entity: playlist.toArray(),
					//	status: EntityStatus.Removed
					//});
				});
		};

		var removePlaylist = function(playlists, playlist) {
			return _.filter(playlists, function(pl) {
				return pl.model.id !== playlist.id;
			});
		};

		var remapIndexes = function(elements) {
			var elIndex = 0;
			_.each(elements, function(elm) {
				elm.model.index = elIndex;
				elIndex++;
			});
			return elements;
		};

		var playMedium = function(mediumViewModel){
			mediaQueueBusiness.enqueueMedium(mediumViewModel.model);
		};

		var addFilesToSelectedPlaylist = function(fileViewModels) {
			observeCurrentPlaylist()
				.asAsyncValue()
				.whereIsNotNull()
				.selectMany(function(selectedPlaylistViewModel) {
					//var mediaFilePathPromises = fileViewModels.map(function(fileVm) {
					//	var mediaFilePath = fileVm.model.selectSelfPhysicalFromLinks();
					//	return selectedPlaylistViewModel.model.addMediumByFilePathToPlaylist(mediaFilePath);
					//});
					//$q.all(mediaFilePathPromises)
					//	.then(function(mediaFilePath) {
					//		mediaFilePath.map(function(mediumFilePath) {
					//			return {
					//				selectedPlaylistViewModel: selectedPlaylistViewModel,
					//				newMedia: mediumFilePath
					//			};
					//		})
					//	});

					return Rx.Observable
						.fromArray(mediaFilePaths)
						.select(function(mediaFilePath) {
							return Rx.Observable.fromPromise(selectedPlaylistViewModel.model.addMediumByFilePathToPlaylist(mediaFilePath))
						})
						.selectMany(function(rx) {
							return rx })
						.toArray()
						.select(function(newMedia) {
							return {
								selectedPlaylistViewModel: selectedPlaylistViewModel,
								newMedia: newMedia
							};
						});


				}) // TODO Cannot insert multiple media on pl without fail
				.do(function(plMediaSetCurrentPl) {
					var plVm = plMediaSetCurrentPl.selectedPlaylistViewModel;
					plVm.media = plVm.media.concat(
						plMediaSetCurrentPl.newMedia.map(viewModelBuilder.buildMediumViewModel)
					);
				})
				.silentSubscribe();
		};

		return {
			observePlayingMedium: observePlayingMedium,
			loadPlaylists: loadPlaylists,
			observePlaylistViewModels: observePlaylistViewModels,
			playlistSelected: playlistSelected,
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