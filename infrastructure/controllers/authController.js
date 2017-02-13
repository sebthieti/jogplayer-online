'use strict';

var Q = require('q');

var _app,
	_passport,
	_routes,
	_authDirector;

function AuthController (app, routes, passport, authDirector) {
	_app = app;
	_routes = routes;
	_passport = passport;
	_authDirector = authDirector;
}

AuthController.prototype.init = function() {

	_app.post(_routes.login.postPath, _passport.authenticate('local'), function(req, res) {
		res.send(200, req.user);
	});

	_app.post(_routes.logout.postPath, function(req, res) {
		req.logout();
		res.send(200, { message: 'Logged out' });
	});

	_app.get(_routes.isAuthenticated.getPath, _authDirector.ensureApiAuthenticated, function(req, res) {
		res.send(200, req.user);
	});

};

module.exports = AuthController;