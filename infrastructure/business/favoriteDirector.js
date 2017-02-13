'use strict';

var _favoriteSaveService;

function FavoriteDirector (favoriteSaveService) {
	_favoriteSaveService = favoriteSaveService;
}

FavoriteDirector.prototype.getFavoritesAsync = function() {
	return _favoriteSaveService.getSortedFavoritesAsync();
};

FavoriteDirector.prototype.addFavoriteAsync = function(favorite) {
	return _favoriteSaveService.addFavoriteAsync(favorite);
};

FavoriteDirector.prototype.updateFavoriteAsync = function(favorite) {
	return _favoriteSaveService.updateFavoriteAsync(favorite);
};

FavoriteDirector.prototype.removeFavoriteByIdAsync = function(favorite) {
	return _favoriteSaveService.removeFavoriteByIdAsync(favorite);
};

module.exports = FavoriteDirector;