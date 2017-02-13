var Q = require('q');

var _favoriteSaveService,
	_favoriteCache = Object.create(null, {});

function FavoriteProxy (favoriteSaveService) {
	_favoriteSaveService = favoriteSaveService;
}

FavoriteProxy.prototype.addFavoriteAsync = function(favorite, user) {
	var self = this;
	return _favoriteSaveService
		.addFavoriteAsync(favorite, user)
		.then(function(addedFavorite) {
			self.invalidateFavoritesForUser(user.username);
			return addedFavorite;
		});
};

FavoriteProxy.prototype.updateFromFavoriteDtoAsync = function(favoriteId, favoriteDto, user) {
	var self = this;
	return _favoriteSaveService
		.updateFromFavoriteDtoAsync(favoriteId, favoriteDto, user)
		.then(function(favorite) {
			self.invalidateFavoritesForUser(user.username);
			return favorite;
		});
};

FavoriteProxy.prototype.removeFavoriteByIdAsync = function(favorite, user) {
	var self = this;
	return _favoriteSaveService
		.removeFavoriteByIdAsync(favorite, user)
		.then(function() {
			self.invalidateFavoritesForUser(user.username);
		});
};

FavoriteProxy.prototype.getUserFavoritesAsync = function(user) {
	var deferred = Q.defer();

	var userFavorites = _favoriteCache[user.username];
	if (userFavorites != null) {
		deferred.resolve(userFavorites);
	} else {
		_favoriteSaveService
			.getSortedFavoritesAsync(user)
			.then(function (userFavorites) {
				_favoriteCache[user.username] = userFavorites;
				deferred.resolve(userFavorites);
			})
			.catch(function (err) {
				deferred.reject(err);
			});
	}

	return deferred.promise;
};

FavoriteProxy.prototype.invalidateFavoritesForUser = function(username) {
	_favoriteCache[username] = null;
};

module.exports = FavoriteProxy;