'use strict';

var Q = require('q');

var _saveService,
	Favorite;

function FavoriteSaveService(saveService, favoriteModel) {
	_saveService = saveService;
	Favorite = favoriteModel;
}

FavoriteSaveService.prototype.getSortedFavoritesAsync = function(owner) {
	var defer = Q.defer();

	Favorite
		.find({ ownerId: owner.id })
		.sort('index')
		.exec(function(err, favorites) {
			if (err) { defer.reject(err) }
			else { defer.resolve(favorites) }
		});

	return defer.promise;
};

FavoriteSaveService.prototype.addFavoriteAsync = function (favorite, owner) {
	if (!favorite) {
		throw "FavoriteSaveService.addFavoriteAsync: favorite must be set";
	}
	if (!owner) {
		throw "FavoriteSaveService.addFavoriteAsync: owner must be set";
	}
	if (favorite._id) {
		throw "FavoriteSaveService.addFavoriteAsync: favorite.Id should not be set";
	}

	var defer = Q.defer();

	var favFields = favorite.getDefinedFields();
	favFields.ownerId = owner.id;

	Favorite.create(
		favFields,
		function(err, favorite) {
		if (err) { defer.reject(err) }
		else { defer.resolve(favorite) }
	});

	return defer.promise;
};

FavoriteSaveService.prototype.updateFromFavoriteDtoAsync = function (favoriteId, favoriteDto, owner) {
	if (!favoriteDto) {
		throw "FavoriteSaveService.updateFromFavoriteDtoAsync: favorite must be set";
	}
	if (!favoriteId) {
		throw "FavoriteSaveService.updateFromFavoriteDtoAsync: favorite.Id should be set";
	}

	var defer = Q.defer();

	Favorite.findOneAndUpdate(
		{ _id: favoriteId, ownerId: owner.id },
		favoriteDto.getDefinedFields(),
		function(err, favorite) {
			if (err) { defer.reject(err) }
			else { defer.resolve(favorite) }
		}
	);

	return defer.promise;
};

FavoriteSaveService.prototype.removeFavoriteByIdAsync = function (favoriteId, owner) {
	if (!favoriteId) {
		throw "FavoriteSaveService.removeFavoriteByIdAsync: favoriteId must be set";
	}

	var defer = Q.defer();

	Favorite.findOneAndRemove(
		{ _id: favoriteId, ownerId: owner.id },
		function(err) {
			if (err) { defer.reject(err) }
			else { defer.resolve() }
		}
	);

	return defer.promise;
};

module.exports = FavoriteSaveService;