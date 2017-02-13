'use strict';

var _favoriteSaveService;

function FavoriteDirector (favoriteSaveService) {
	_favoriteSaveService = favoriteSaveService;
}

FavoriteDirector.prototype.getFavoritesAsync = function(issuer) {
	return _favoriteSaveService.getSortedFavoritesAsync(issuer);
};

FavoriteDirector.prototype.addFavoriteAsync = function(favorite, issuer) {
	return _favoriteSaveService.addFavoriteAsync(favorite, issuer);
};

FavoriteDirector.prototype.updateFromFavoriteDtoAsync = function(favoriteId, favoriteDto, issuer) {
	return _favoriteSaveService.updateFromFavoriteDtoAsync(favoriteId, favoriteDto, issuer);
};

FavoriteDirector.prototype.removeFavoriteByIdAsync = function(favorite, issuer) {
	return _favoriteSaveService.removeFavoriteByIdAsync(favorite, issuer);
};

module.exports = FavoriteDirector;