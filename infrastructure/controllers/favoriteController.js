'use strict';

var _app,
	_favoriteDirector;

function FavoriteController (app, favoriteDirector) {
	_app = app;
	_favoriteDirector = favoriteDirector;
}

FavoriteController.prototype.init = function() {
	_app.get("/api/favorites/", function(req, res) {
		_favoriteDirector
			.getFavoritesAsync()
			.then(function(data) { res.send(data) })
			.catch(function(err) { res.send(400, err) })
			.done();
	});

	_app.post("/api/favorites/", function(req, res) {
		// TODO Don't forget validator
		var favorite = req.body;

		if (!favorite) {
			res.send(400, "favorite has not been providen.");
			return;
		}

		_favoriteDirector
			.addFavoriteAsync(favorite)
			.then(function(data) { res.send(data) })
			.catch(function(err) { res.send(400, err) })
			.done();
	});

	_app.put("/api/favorites/:favId", function(req, res) {
		var favId = req.params.favId;
		// TODO Maybe care about using param ?
		if (favId === undefined) {
			res.send(400, "Id must be set.");
			return;
		}
		// TODO Don't forget validator
		var favorite = req.body;

		if (!favorite) {
			res.send(400, "favorite has not been providen.");
			return;
		}

		_favoriteDirector
			.updateFavoriteAsync(favorite)
			.then(function(data) { res.send(data) })
			.catch(function(err) { res.send(400, err) })
			.done();
	});

	_app.delete("/api/favorites/:favId", function(req, res) {
		var favId = req.params.favId;
		if (favId === undefined) {
			res.send(400, "Id must be set.");
			return;
		}

		_favoriteDirector
			.removeFavoriteByIdAsync(favId)
			.then(function() { res.send(204) })
			.catch(function(err) { res.send(400, err) })
			.done();
	});
};

module.exports = FavoriteController;