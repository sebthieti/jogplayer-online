'use strict';

var fs = require('fs'),
	Q = require('q'),
	process = require('process'),
	path = require('path');

var _app,
	_configDirector,
	_routes;

function SetupController (app, configDirector, routes) {
	_app = app;
	_configDirector = configDirector;
	_routes = routes;
}

SetupController.prototype.init = function() {
	_app.get("/setup", function(req, res) {
		res.render("setup");
	});

	_app.post("/setup", function(req, res) {
		_configDirector
			.setRootUserAsync(req.body)
			.then(function() {
				res.redirect('/');
			});
	});
};

module.exports = SetupController;