'use strict';

var Q = require('q'),
	Favorite = require('../../models').Favorite;

var _saveService;

function FavoriteSaveService(saveService) {
	_saveService = saveService;
}

FavoriteSaveService.prototype.getSortedFavoritesAsync = function() {
	var defer = Q.defer();

	Favorite
		.find({})
		.sort('index')
		.exec(function(err, favorites) {
			if (err) {
				defer.reject(err);
			} else {
				defer.resolve(favorites);
			}
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

	Favorite.create({
		name: favorite.name,
		index: favorite.index,
		folderPath: favorite.folderPath
	}, function(err, favorite) {
		if (err) {
			defer.reject(err);
		} else {
			defer.resolve(favorite);
		}
	});

	return defer.promise;
};

FavoriteSaveService.prototype.updateFavoriteAsync = function (favorite) {
	if (!favorite) {
		throw "FavoriteSaveService.updateFavoriteAsync: favorite must be set";
	}
	if (!favorite._id) {
		throw "FavoriteSaveService.updateFavoriteAsync: favorite.Id should be set";
	}

	var defer = Q.defer();

	Favorite.findOneAndUpdate( // TODO Assert on fav not found
		{ _id: favorite._id },
		{
			index: favorite.index,
			name: favorite.name,
			folderPath: favorite.folderPath
		},
		function(err, favorite) {
			if (err) {
				defer.reject(err);
			} else {
				defer.resolve(favorite);
			}
		}
	);

	return defer.promise;
};

FavoriteSaveService.prototype.removeFavoriteByIdAsync = function (favId) {
	if (!favId) {
		throw "FavoriteSaveService.removeFavoriteByIdAsync: favId must be set";
	}

	var defer = Q.defer();

	Favorite.findOneAndRemove( // TODO Assert on fav not found
		{ _id: favId },
		function(err) {
			if (err) {
				defer.reject(err);
			} else {
				defer.resolve();
			}
		}
	);

	return defer.promise;
};

module.exports = FavoriteSaveService;