'use strict';

jpoApp.factory('favoriteBusiness', ['FavoriteModel', 'authBusiness', function(FavoriteModel, authBusiness) {
	var linkHelper = Helpers.Link;

	var favoritesSubject = new Rx.BehaviorSubject();
	var favoriteChangeSubject = new Rx.Subject();
	var selectedFavoriteSubject = new Rx.Subject();

	loadFavorites();
	clearUsersOnUserLogoff();

	function observeFavorites() {
		return favoritesSubject.whereIsDefined();
	}

	function getAndObserveFavorite(favId) {
		return observeFavorites()
			.whereHasValue()
			.where(function (f) {return f.id === favId});
	}

	function observeFavoriteChanges() {
		return favoriteChangeSubject;
	}

	function addFolderToFavoritesAsync(folderPath) {
		observeFavorites().getValueAsync(function(favorites) {
			// Get folder name for fav name.
			var favCount = 0;
			if (favorites) {
				favCount = favorites.length;
			}

			var favorite = FavoriteModel.createEntity(
				_.last(splitFolderPath(folderPath)),
				folderPath,
				favCount
			);

			FavoriteModel
				.addAsync(favorite)
				.then(function (newFavorite) {
					favorites = favorites.concat(newFavorite);
					favoritesSubject.onNext(favorites);
				});
		});
	}

	// TODO May be moved to helper ?
	function splitFolderPath(folderPath) {
		var levels = folderPath.split("/");
		return _.filter(
			levels,
			function(lvl) {
				return lvl !== ''
			});
	}

	function updateFavoriteAsync(favoriteModel) {
		return favoriteModel.updateAsync();
	}

	function deleteFavoriteAsync(favoriteModel) {
		return favoriteModel
			.removeAsync()
			.then(function () {
				observeFavorites().getValueAsync(function(favorites){
					var updatedFavorites = deleteFavorite(favorites, favoriteModel);
					updatedFavorites = remapIndexes(updatedFavorites);

					favoritesSubject.onNext(updatedFavorites);
				});
			});
	}

	function deleteFavorite(favorites, favorite) {
		return _.filter(favorites, function(fav) {
			return fav.id !== favorite.id;
		});
	}

	// TODO Business should create VM, and receive VM
	function remapIndexes(favorites) {
		var favIndex = 0;
		_.each(favorites, function(fav) {
			fav.index = favIndex;
			favIndex++;
		});
		return favorites;
	}

	function observeSelectedFavorite() {
		return selectedFavoriteSubject;
	}

	function observeSelectedFavoriteLink() {
		return observeSelectedFavorite()
			.selectMany(function (favorite) {
				var target = linkHelper.selectTargetLinkFromLinks(favorite.links);
				return target.href;
			})
	}

	function changeSelectedFavorite(favorite) {
		selectedFavoriteSubject.onNext(favorite); // TODO Use only link ?
	}

	function loadFavorites() {
		authBusiness
			.observeAuthenticatedUser()
			.whereHasValue()
			.do(function(__) {
				FavoriteModel
					.getAsync()
					.then(function(favorites) {
						favoritesSubject.onNext(favorites);
					});
			})
			.silentSubscribe();
	}

	function clearUsersOnUserLogoff() {
		authBusiness
			.observeCurrentUserAuthentication()
			.whereIsNull()
			.do(function() {
				favoritesSubject.onNext(null);
			})
			.silentSubscribe();
	}

	return {
		observeFavorites: observeFavorites, // TODO Starts w/ get but no start with!
		getAndObserveFavorite: getAndObserveFavorite, // TODO Starts w/ get but no start with!
		observeSelectedFavorite: observeSelectedFavorite,
		observeFavoriteChanges: observeFavoriteChanges,
		observeSelectedFavoriteLink: observeSelectedFavoriteLink,

		addFolderToFavoritesAsync: addFolderToFavoritesAsync,
		updateFavoriteAsync: updateFavoriteAsync,
		deleteFavoriteAsync: deleteFavoriteAsync,
		changeSelectedFavorite: changeSelectedFavorite//,
		//loadFavorites: loadFavorites
	}
}]);