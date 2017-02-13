'use strict';

var Q = require('q'),
	FavoriteDto = require('../dto').FavoriteDto;

var _app,
	_favoriteDirector,
	_routes,
	_authDirector;

var assertAndGetFavoriteId = function (obj) {
	if (!obj || !obj.favId) {
		throw 'Id must be set.';
	}
	return obj.favId;
};

function FavoriteController (app, routes, favoriteDirector, authDirector) {
	_app = app;
	_routes = routes;
	_favoriteDirector = favoriteDirector;
	_authDirector = authDirector;
}

FavoriteController.prototype.init = function() {
	_app.get(_routes.favorites.getPath, _authDirector.ensureApiAuthenticated, function(req, res) {
		_favoriteDirector
			.getUserFavoritesAsync(req.user)
			.then(function(data) { res.send(data) })
			.catch(function(err) { res.status(400).send(err) })
			.done();
	});

	_app.post(_routes.favorites.insertPath, _authDirector.ensureApiAuthenticated, function(req, res) {
		Q.fcall(FavoriteDto.toDto, req.body)
		.then(function(dto) {
			return _favoriteDirector.addFavoriteAsync(dto, req.user);
		})
		.then(function(data) { res.send(data) })
		.catch(function(err) { res.status(400).send(err) })
		.done();
	});

	_app.patch(_routes.favorites.updatePath, _authDirector.ensureApiAuthenticated, function(req, res) {
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
				reqSet.favorite,
				req.user
			);
		})
		.then(function(data) { res.status(200).send(data) })
		.catch(function(err) { res.status(400).send(err) })
		.done();
	});

	_app.delete(_routes.favorites.deletePath, _authDirector.ensureApiAuthenticated, function(req, res) {
		Q.fcall(assertAndGetFavoriteId, req.params)
		.then(function(dto) {
			return _favoriteDirector.removeFavoriteByIdAsync(dto, req.user);
		})
		.then(function() { res.sendStatus(204) })
		.catch(function(err) { res.status(400).send(err) })
		.done();
	});
};

module.exports = FavoriteController;