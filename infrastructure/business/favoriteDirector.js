'use strict';

var _favoriteSaveService;

function FavoriteDirector (favoriteSaveService) {
	_favoriteSaveService = favoriteSaveService;
}

FavoriteDirector.prototype.getFavoritesAsync = function(owner) {
	return _favoriteSaveService.getSortedFavoritesAsync(owner);
};

FavoriteDirector.prototype.addFavoriteAsync = function(favorite, owner) {
	return _favoriteSaveService.addFavoriteAsync(favorite, owner);
};

FavoriteDirector.prototype.updateFromFavoriteDtoAsync = function(favoriteId, favoriteDto, owner) {
	return _favoriteSaveService.updateFromFavoriteDtoAsync(favoriteId, favoriteDto, owner);
};

FavoriteDirector.prototype.removeFavoriteByIdAsync = function(favorite, owner) {
	return _favoriteSaveService.removeFavoriteByIdAsync(favorite, owner);
};

module.exports = FavoriteDirector;