'use strict';

var Q = require('q');

var _saveService,
	Favorite;

function FavoriteSaveService(saveService, favoriteModel) {
	_saveService = saveService;
	Favorite = favoriteModel;
}

FavoriteSaveService.prototype.getSortedFavoritesAsync = function(issuer) {
	var defer = Q.defer();

	Favorite
		.find({ ownerId: issuer.id })
		.sort('index')
		.exec(function(err, favorites) {
			if (err) { defer.reject(err) }
			else { defer.resolve(favorites) }
		});

	return defer.promise;
};

FavoriteSaveService.prototype.addFavoriteAsync = function (favorite, issuer) {
	if (!favorite) {
		throw new Error('FavoriteSaveService.addFavoriteAsync: favorite must be set');
	}
	if (!issuer) {
		throw new Error('FavoriteSaveService.addFavoriteAsync: issuer must be set');
	}
	if (favorite._id) {
		throw new Error('FavoriteSaveService.addFavoriteAsync: favorite.Id should not be set');
	}

	var defer = Q.defer();

	var favFields = favorite.getDefinedFields();
	favFields.ownerId = issuer.id;

	Favorite.create(
		favFields,
		function(err, favorite) {
		if (err) { defer.reject(err) }
		else { defer.resolve(favorite) }
	});

	return defer.promise;
};

FavoriteSaveService.prototype.updateFromFavoriteDtoAsync = function (favoriteId, favoriteDto, issuer) {
	if (!favoriteDto) {
		throw new Error('FavoriteSaveService.updateFromFavoriteDtoAsync: favorite must be set');
	}
	if (!favoriteId) {
		throw new Error('FavoriteSaveService.updateFromFavoriteDtoAsync: favorite.Id should be set');
	}

	var defer = Q.defer();

	Favorite.findOneAndUpdate(
		{ _id: favoriteId, ownerId: issuer.id },
		favoriteDto.getDefinedFields(),
		function(err, favorite) {
			if (err) { defer.reject(err) }
			else { defer.resolve(favorite) }
		}
	);

	return defer.promise;
};

FavoriteSaveService.prototype.removeFavoriteByIdAsync = function (favoriteId, issuer) {
	if (!favoriteId) {
		throw new Error('FavoriteSaveService.removeFavoriteByIdAsync: favoriteId must be set');
	}

	var defer = Q.defer();

	Favorite.findOneAndRemove(
		{ _id: favoriteId, ownerId: issuer.id },
		function(err) {
			if (err) { defer.reject(err) }
			else { defer.resolve() }
		}
	);

	return defer.promise;
};

module.exports = FavoriteSaveService;