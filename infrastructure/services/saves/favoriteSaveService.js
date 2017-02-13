'use strict';

var Q = require('q');

var _saveService,
	Favorite;

function FavoriteSaveService(saveService, favoriteModel) {
	_saveService = saveService;
	Favorite = favoriteModel;
}

FavoriteSaveService.prototype.getSortedFavoritesAsync = function() {
	var defer = Q.defer();

	Favorite
		.find({})
		.sort('index')
		.exec(function(err, favorites) {
			if (err) { defer.reject(err) }
			else { defer.resolve(favorites) }
		});

	return defer.promise;
};

FavoriteSaveService.prototype.addFavoriteAsync = function (favorite) {
	if (!favorite) {
		throw "FavoriteSaveService.addFavoriteAsync: favorite must be set";
	}
	if (favorite._id) {
		throw "FavoriteSaveService.addFavoriteAsync: favorite.Id should not be set";
	}

	var defer = Q.defer();

	Favorite.create(
		favorite.getDefinedFields(),
		function(err, favorite) {
		if (err) { defer.reject(err) }
		else { defer.resolve(favorite) }
	});

	return defer.promise;
};

FavoriteSaveService.prototype.updateFromFavoriteDtoAsync = function (favoriteId, favoriteDto) {
	if (!favoriteDto) {
		throw "FavoriteSaveService.updateFromFavoriteDtoAsync: favorite must be set";
	}
	if (!favoriteId) {
		throw "FavoriteSaveService.updateFromFavoriteDtoAsync: favorite.Id should be set";
	}

	var defer = Q.defer();

	Favorite.findOneAndUpdate(
		{ _id: favoriteId },
		favoriteDto.getDefinedFields(),
		function(err, favorite) {
			if (err) { defer.reject(err) }
			else { defer.resolve(favorite) }
		}
	);

	return defer.promise;
};

FavoriteSaveService.prototype.removeFavoriteByIdAsync = function (favId) {
	if (!favId) {
		throw "FavoriteSaveService.removeFavoriteByIdAsync: favId must be set";
	}

	var defer = Q.defer();

	Favorite.findOneAndRemove(
		{ _id: favId },
		function(err) {
			if (err) { defer.reject(err) }
			else { defer.resolve() }
		}
	);

	return defer.promise;
};

module.exports = FavoriteSaveService;