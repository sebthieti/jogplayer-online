var Q = require('q'),
	mongodb = require('mongodb');

module.exports = (function () {
	'use strict';

	var _saveService;

	function FavoriteSaveService(saveService) {
		_saveService = saveService;
	}

	FavoriteSaveService.prototype.getFavoritesAsync = function() {
		return _saveService
			.getFavoritesRepositoryAsync()
			.then(selectAndSortFavoritesAsync)
			.then(castFavoriteSetToEntitiesAsync);
	};

	FavoriteSaveService.prototype.addFavoriteAsync = function (favorite) {
		if (!favorite) {
			throw "FavoriteSaveService.addFavoriteAsync: favorite must be set";
		}
		if (favorite._id) {
			throw "FavoriteSaveService.addFavoriteAsync: favorite.Id should not be set";
		}

		return _saveService
			.getFavoritesRepositoryAsync()
			.then(function(favoritesSet) {
				return Q.promise(function(onSuccess, onError) {
					favorite.createdOn = new Date().toJSON();
					favoritesSet.insert(favorite, function (err, newFavorite) {
						if (err) {
							onError(err);
						}
						else {
							onSuccess(newFavorite[0]);
						}
					})
				});
			});
	};

	FavoriteSaveService.prototype.updateFavoriteAsync = function (favorite) {
		if (!favorite) {
			throw "FavoriteSaveService.updateFavoriteAsync: favorite must be set";
		}
		if (!favorite._id) {
			throw "FavoriteSaveService.updateFavoriteAsync: favorite.Id should be set";
		}

		return _saveService
			.getFavoritesRepositoryAsync()
			//.then(assertOnFavoriteNotFound) // TODO
			.then(function(favoritesSet) {
				return Q.promise(function(onSuccess, onError) {
					favorite.updatedOn = new Date().toJSON();
					favoritesSet.update(
						{ _id: mongodb.ObjectID(favorite._id) },
						{ $set: {
							index: favorite.index,
							name: favorite.name,
							folderPath: favorite.folderPath
						} },
						function(err, nModified) {
							if (!err && nModified === 1) {
								onSuccess(favorite);
							} else if (err) {
								onError(err);
							} else {
								onError('No favorite could be updated');
							}
						}
					);
				});
			});
	};

	FavoriteSaveService.prototype.removeFavoriteByIdAsync = function (favId) {
		return _saveService
			.getFavoritesRepositoryAsync()
			.then(function(favoritesSet) {
				return Q.promise(function(onSuccess, onError) {
					favoritesSet.remove(
						{ _id: mongodb.ObjectID(favId) },
						function (err, nDeleted) {
							if (!err && nDeleted == 1) {
								onSuccess();
							} else if (err) {
								onError(err);
							} else {
								onError('No favorite could be deleted');
							}
						}
					);
				});
			});
	};

	var selectAndSortFavoritesAsync = function (favoritesSet) {
		return Q.fcall(function() {
			return favoritesSet
				.find( {} )
				.sort( {index: 1} );
		});
	};

	var castFavoriteSetToEntitiesAsync = function (favoritesSet) {
		return Q.promise(function (onSuccess, onError) {
			favoritesSet.toArray(function (err, favArray) {
				if (!err) {
//					var plEntities = from(plArray)
//						.select(function(dtoPlaylist) {
//							return playlist.fromDto(dtoPlaylist)
//						})
//						.toArray();
					onSuccess(/*plEntities*/favArray);
				} else {
					onError(err);
				}
			});
		});
	};

	return FavoriteSaveService;
})();