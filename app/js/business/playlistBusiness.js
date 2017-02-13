'use strict';

jpoApp.factory('playlistBusiness', function(playlistService, mediaService) {

	var playlists,
		media;

	var linkHelper = Helpers.linkHelpers;
	var EntityStatus = JpoAppTypes.EntityStatus;

	var playlistsSubject = new Rx.Subject();
	var playlistChangeSubject = new Rx.Subject();
	var mediaSubject = new Rx.Subject();
	//var selectedPlaylistSubject = new Rx.Subject();

	var loadAndObservePlaylists = function() {
		return Rx.Observable
			.fromPromise(loadPlaylistsAsync())
			.do(function(pls) { playlists = pls })
			.concat(playlistsSubject);
	};

	var loadPlaylistsAsync = function () {
		return playlistService
			.getPlaylists()
			.then(function (playlists) {
				return buildViewModels(playlists);
			}, function (err) {
			});
	};



	var observeMedia = function() {
		return mediaSubject
			.do(function(m) { media = m });
	};

	var playlistSelected = function(playlist) {
		return loadMediaAsync(playlist)
			.then(function(media) {
				var mediaVm = buildMediaViewModels(media);
				mediaSubject.onNext(mediaVm);
				return mediaVm;
			});
	};

	var loadMediaAsync = function(playlist) {
		return playlistService.getPlaylistMedia(playlist);
	};

	var buildViewModels = function (playlists) {
		return playlists.map(buildViewModel);
	};

	var buildViewModel = function (playlist) {
		playlist.isEditing = false;
		return playlist;
	};

	var buildMediaViewModels = function (media) {
		return media.map(buildMediumViewModel);
	};

	var buildMediumViewModel = function (medium) {
		medium.isPlaying = false;
		return medium;
	};

	var addVirtualPlaylistAsync = function(playlist){
		//var favCount = 0;
		//if (favorites) {
		//	favCount = favorites.length;
		//}
		//
		//var favorite = { // TODO To builder
		//	name: _.last(splitFolderPath(folderPath)),
		//	folderPath: folderPath,
		//	index: favCount
		//};
		//
		//favoriteService
		//	.addFavoriteAsync(favorite)
		//	.then(function (newFavorite) {
		//		favorites = favorites.concat(newFavorite);
		//
		//		favoriteSubject.onNext(favorites);
		//		favoriteChangeSubject.onNext({
		//			entity: favorite.toArray(),
		//			status: EntityStatus.Added
		//		});
		//	});
		//
		//


		return playlistService
			.addPlaylist(playlist)
			.then(function(newPlaylist) {
				//$scope.newPlaylist = null;
				//$scope.isAdding = false;
				playlists = playlists.concat(newPlaylist);

				playlistsSubject.onNext(favorites);
				playlistChangeSubject.onNext({
					entity: playlist.toArray(),
					status: EntityStatus.Added
				});
			});
	};

	var updatePlaylistAsync = function(playlist){
		return playlistService
			.updatePlaylist(playlist)
			.then(function(updatedPlaylist) {
				playlists = updatePlaylists(playlist);

				playlistChangeSubject.onNext({
					entity: updatedPlaylist.toArray(),
					status: EntityStatus.Updated
				});
				return playlist.updateFieldsFrom(updatedPlaylist);
			});
	};

	var updatePlaylists = function(playlist) {
		var plToUpdate =_.find(playlists, function(pl) {
			return pl._id === playlist._id;
		});

		var plIndex = playlists.indexOf(plToUpdate);
		playlists[plIndex] = playlist;
		return playlists;
	};


	var deleteMedia = function(){

	};



	var getPlaylistMedia = function(){

	};

	var removePlaylistAsync = function(playlist){
		return playlistService
			.removePlaylist(playlist)
			.then(function() {
				//$scope.playlists = _.filter($scope.playlists, function(pl) {
				//	return pl._id !== playlist._id;
				//});
				//
				//$scope.media = null;
				//$scope.selectedPlaylist = null;
				mediaSubject.onNext(null);
				//selectedPlaylistSubject.onNext(null);

				playlists = deletePlaylist(playlist);
				playlists = remapIndexes(playlists);

				playlistsSubject.onNext(playlists);
				playlistChangeSubject.onNext({
					entity: playlist.toArray(),
					status: EntityStatus.Removed
				});
			});
	};

	var deletePlaylist = function(playlist) {
		return _.filter(playlists, function(pl) {
			return pl.id !== playlist.id;
		});
	};

	var remapIndexes = function(favorites) {
		var favIndex = 0;
		_.each(favorites, function(fav) {
			fav.index = favIndex;
			favIndex++;
		});
		return favorites;
	};


	var playMedia = function(){

	};






	return {
		loadAndObservePlaylists: loadAndObservePlaylists,
		observeMedia: observeMedia,
		playlistSelected: playlistSelected,
		updatePlaylistAsync: updatePlaylistAsync,
		removePlaylistAsync: removePlaylistAsync,
		addVirtualPlaylistAsync: addVirtualPlaylistAsync
	}
});