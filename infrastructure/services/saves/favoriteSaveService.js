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
	var defer = Q.defer();
	if (!favorite || !issuer || favorite._id) {
		if (!favorite) {
			defer.reject(new Error('FavoriteSaveService.addFavoriteAsync: favorite must be set'));
		} else if (!issuer) {
			defer.reject(new Error('FavoriteSaveService.addFavoriteAsync: issuer must be set'));
		} else if (favorite._id) {
			defer.reject(new Error('FavoriteSaveService.addFavoriteAsync: favorite.Id should not be set'));
		}
		return defer.promise;
	}

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
	var defer = Q.defer();
	if (!favoriteDto || !favoriteId) {
		if (!favoriteDto) {
			defer.reject(new Error('FavoriteSaveService.updateFromFavoriteDtoAsync: favorite must be set'));
		} else if (!favoriteId) {
			defer.reject(new Error('FavoriteSaveService.updateFromFavoriteDtoAsync: favorite.Id should be set'));
		}
		return defer.promise;
	}

	Favorite.findOneAndUpdate(
		{ _id: favoriteId, ownerId: issuer.id },
		favoriteDto.getDefinedFields(),
		{ 'new': true }, // Return modified doc.
		function(err, favorite) {
			if (err) { defer.reject(err) }
			else { defer.resolve(favorite) }
		}
	);

	return defer.promise;
};

FavoriteSaveService.prototype.removeFavoriteByIdAsync = function (favoriteId, issuer) {
	var defer = Q.defer();
	if (!favoriteId) {
		defer.reject(new Error('FavoriteSaveService.removeFavoriteByIdAsync: favoriteId must be set'));
		return defer.promise;
	}

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
