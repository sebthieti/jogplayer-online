'use strict';

var Q = require('q'),
	FavoriteDto = require('../dto').FavoriteDto;

var _app,
	_favoriteDirector,
	_routes;

var assertAndGetFavoriteId = function (obj) {
	if (!obj || !obj.favId) {
		throw 'Id must be set.';
	}
	return obj.favId;
};

function FavoriteController (app, routes, favoriteDirector) {
	_app = app;
	_routes = routes;
	_favoriteDirector = favoriteDirector;
}

FavoriteController.prototype.init = function() {
	_app.get(_routes.favorites.getPath, function(req, res) {
		_favoriteDirector
			.getFavoritesAsync()
			.then()
			.then(function(data) { res.send(data) })
			.catch(function(err) { res.send(400, err) })
			.done();
	});

	_app.post(_routes.favorites.insertPath, function(req, res) {
		Q.fcall(FavoriteDto.toDto, req.body)
		.then(_favoriteDirector.addFavoriteAsync)
		.then(function(data) { res.send(data) })
		.catch(function(err) { res.send(400, err) })
		.done();
	});

	_app.patch(_routes.favorites.updatePath, function(req, res) {
		Q.fcall(assertAndGetFavoriteId, req.params)
		.then(function (favId) {
			return {
				favId: favId,
				favorite: FavoriteDto.toDto(req.body, favId)
			}
		})
		.then(function (reqSet) {
			return _favoriteDirector.updateFromFavoriteDtoAsync( // TODO Maybe change method in save layer that uses dtos
				reqSet.favId,
				reqSet.favorite
			);
		})
		.then(function(data) { res.send(200, data) })
		.catch(function(err) { res.send(400, err) })
		.done();
	});

	_app.delete(_routes.favorites.deletePath, function(req, res) {
		Q.fcall(assertAndGetFavoriteId, req.params)
		.then(_favoriteDirector.removeFavoriteByIdAsync)
		.then(function() { res.send(204) })
		.catch(function(err) { res.send(400, err) })
		.done();
	});
};

module.exports = FavoriteController;