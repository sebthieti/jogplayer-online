'use strict';

jpoApp.factory('favoriteBusiness', function(favoriteService) {
	var EntityStatus = JpoAppTypes.EntityStatus;
	var favoriteSubject = new Rx.Subject();
	var favoriteChangeSubject = new Rx.Subject();
	var selectedFavoriteSubject = new Rx.Subject();
	var favorites; // TODO Move to proxy

	// TODO Resend all favorites or only change ?
	// 1st call, array or favs. other calls, one fav (i may make an array ?)
	// Give array observable favs
	var getAndObserveFavorites = function () {
		return Rx.Observable
			.fromPromise(favoriteService.getFavoritesAsync())
			.do(function(favs) { favorites = favs })
			/*.map(function(favorites) { return { // TODO To change subject
				entity: favorites,
				status: EntityStatus.Unknown
			}})*/
			.concat(favoriteSubject);
	};

	var getAndObserveFavorite = function (favId) {
		return this.getAndObserveFavorites()
			.where(function (f) {
				return f.id === favId
			});
	};

	var observeFavoriteChanges = function() {
		return favoriteChangeSubject;
	};

	var addFolderToFavoritesAsync = function(folderPath) {
		// Get folder name for fav name.
		//var folderPath = $scope.currentFileExplorerDirPath;

		var favCount = 0;
		if (favorites) {
			favCount = favorites.length;
		}

		var favorite = { // TODO To builder
			name: _.last(splitFolderPath(folderPath)),
			folderPath: folderPath,
			index: favCount
		};

		favoriteService
			.addFavoriteAsync(favorite)
			.then(function (newFavorite) {
				favorites = favorites.concat(newFavorite);

				favoriteSubject.onNext(favorites);
				favoriteChangeSubject.onNext({
					entity: favorite.toArray(),
					status: EntityStatus.Added
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

	var updateFavoriteAsync = function(favorite) {
		return favoriteService
			.updateFavoriteAsync(favorite)
			.then(function (updatedFav) {
				favorites = updateFavorites(favorite);

				favoriteChangeSubject.onNext({
					entity: updatedFav.toArray(),
					status: EntityStatus.Updated
				});
				return favorite.updateFieldsFrom(updatedFav);
			});
	};

	var updateFavorites = function(favorite) {
		var favToUpdate =_.find(favorites, function(fav) {
			return fav._id === favorite._id;
		});

		var favIndex = favorites.indexOf(favToUpdate);
		favorites[favIndex] = favorite;
		return favorites;
	};

	var deleteFavoriteAsync = function(favorite) {
		return favoriteService
			.deleteFavoriteAsync(favorite)
			.then(function () {
				favorites = deleteFavorite(favorite);
				favorites = remapIndexes(favorites);

				favoriteSubject.onNext(favorites);
				favoriteChangeSubject.onNext({
					entity: favorite.toArray(),
					status: EntityStatus.Removed
				});
			});
	};

	var deleteFavorite = function(favorite) {
		return _.filter(favorites, function(fav) {
			return fav.id !== favorite.id;
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

	var observeSelectedFavorite = function() {
		return selectedFavoriteSubject;
	};

	var changeSelectedFavorite = function(favorite) {
		selectedFavoriteSubject.onNext(favorite); // TODO Use only link ?
		//$scope.changeDirByLinkCmd = function(link){
		//	$scope.$emit('changeDirectoryByLink', link);
		//};
	};

	return {
		getAndObserveFavorites: getAndObserveFavorites, // TODO Starts w/ get but no start with!
		getAndObserveFavorite: getAndObserveFavorite, // TODO Starts w/ get but no start with!
		observeSelectedFavorite: observeSelectedFavorite,
		observeFavoriteChanges: observeFavoriteChanges,

		addFolderToFavoritesAsync: addFolderToFavoritesAsync,
		updateFavoriteAsync: updateFavoriteAsync,
		deleteFavoriteAsync: deleteFavoriteAsync,
		changeSelectedFavorite: changeSelectedFavorite
	}
});