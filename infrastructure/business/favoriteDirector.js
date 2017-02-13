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

	updateFavoriteAsync: function(favorite) {
		return _favoriteSaveService.updateFavoriteAsync(favorite);
	},

	removeFavoriteByIdAsync: function(favorite) {
		return _favoriteSaveService.removeFavoriteByIdAsync(favorite);
	}
};

module.exports = FavoriteDirector;