'use strict';

var _favoriteProxy;

function FavoriteDirector (favoriteProxy) {
	_favoriteProxy = favoriteProxy;
}

FavoriteDirector.prototype.getUserFavoritesAsync = function(user) {
	return _favoriteProxy.getUserFavoritesAsync(user);
};

FavoriteDirector.prototype.addFavoriteAsync = function(favorite, issuer) {
	return _favoriteProxy.addFavoriteAsync(favorite, issuer);
};

FavoriteDirector.prototype.updateFromFavoriteDtoAsync = function(favoriteId, favoriteDto, issuer) {
	return _favoriteProxy.updateFromFavoriteDtoAsync(favoriteId, favoriteDto, issuer);
};

FavoriteDirector.prototype.removeFavoriteByIdAsync = function(favorite, issuer) {
	return _favoriteProxy.removeFavoriteByIdAsync(favorite, issuer);
};

module.exports = FavoriteDirector;