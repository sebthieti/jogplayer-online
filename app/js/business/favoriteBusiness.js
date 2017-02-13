'use strict';

jpoApp.factory('favoriteBusiness', ['FavoriteModel', 'authBusiness', function(FavoriteModel, authBusiness) {
	var linkHelper = Helpers.linkHelpers;

	var favoritesSubject = new Rx.BehaviorSubject();
	var favoriteChangeSubject = new Rx.Subject();
	var selectedFavoriteSubject = new Rx.Subject();

	var observeFavorites = function() {
		return favoritesSubject.whereIsDefined();
	};

	var getAndObserveFavorite = function (favId) {
		return observeFavorites().where(function (f) {
			return f.id === favId
		});
	};

	var observeFavoriteChanges = function() {
		return favoriteChangeSubject;
	};

	var addFolderToFavoritesAsync = function(folderPath) {
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
	};

	// TODO May be moved to helper ?
	var splitFolderPath = function(folderPath) {
		var levels = folderPath.split("/");
		return _.filter(
			levels,
			function(lvl) {
				return lvl !== ''
			});
	};

	var updateFavoriteAsync = function(favoriteModel) {
		return favoriteModel.updateAsync();
	};

	var deleteFavoriteAsync = function(favoriteModel) {
		return favoriteModel
			.removeAsync()
			.then(function () {
				observeFavorites().getValueAsync(function(favorites){
					var updatedFavorites = deleteFavorite(favorites, favoriteModel);
					updatedFavorites = remapIndexes(updatedFavorites);

					favoritesSubject.onNext(updatedFavorites);
				});
			});
	};

	var deleteFavorite = function(favorites, favorite) {
		return _.filter(favorites, function(fav) {
			return fav.id !== favorite.id;
		});
	};

	// TODO Business should create VM, and receive VM
	var remapIndexes = function(favorites) {
		var favIndex = 0;
		_.each(favorites, function(fav) {
			fav.index = favIndex;
			favIndex++;
		});
		return favorites;
	};

	var observeSelectedFavorite = function() {
		return selectedFavoriteSubject;
	};

	var observeSelectedFavoriteLink = function() {
		return observeSelectedFavorite()
			.selectMany(function (favorite) {
				var target = linkHelper.selectTargetLinkFromLinks(favorite.links);
				return target.href;
			})
	};

	var changeSelectedFavorite = function(favorite) {
		selectedFavoriteSubject.onNext(favorite); // TODO Use only link ?
	};

	//authBusiness
	//	.observeAuthenticatedUser()
	//	.do(function(user) {
	function loadFavorites() {
		authBusiness
			.observeAuthenticatedUser()
			.asAsyncValue()
			.do(function(__) {
				FavoriteModel
					.getAllAsync()
					.then(function(favorites) {
						favoritesSubject.onNext(favorites);
					});
			})
			.silentSubscribe();
	}

		//})
		//.silentSubscribe();

	return {
		observeFavorites: observeFavorites, // TODO Starts w/ get but no start with!
		getAndObserveFavorite: getAndObserveFavorite, // TODO Starts w/ get but no start with!
		observeSelectedFavorite: observeSelectedFavorite,
		observeFavoriteChanges: observeFavoriteChanges,
		observeSelectedFavoriteLink: observeSelectedFavoriteLink,

		addFolderToFavoritesAsync: addFolderToFavoritesAsync,
		updateFavoriteAsync: updateFavoriteAsync,
		deleteFavoriteAsync: deleteFavoriteAsync,
		changeSelectedFavorite: changeSelectedFavorite,
		loadFavorites: loadFavorites
	}
}]);