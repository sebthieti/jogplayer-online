'use strict';

var _favoriteSaveService;

function FavoriteDirector (favoriteSaveService) {
	_favoriteSaveService = favoriteSaveService;
}

FavoriteDirector.prototype = {
	getFavoritesAsync: function() {
		return _favoriteSaveService.getSortedFavoritesAsync();
	},

	addFavoriteAsync: function(favorite) {
		return _favoriteSaveService.addFavoriteAsync(favorite);
	},

	updateFromFavoriteDtoAsync: function(favoriteId, favoriteDto) {
		return _favoriteSaveService.updateFromFavoriteDtoAsync(favoriteId, favoriteDto);
	},

	removeFavoriteByIdAsync: function(favorite) {
		return _favoriteSaveService.removeFavoriteByIdAsync(favorite);
	}
};

module.exports = FavoriteDirector;