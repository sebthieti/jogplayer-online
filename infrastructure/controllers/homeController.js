'use strict';

var fs = require('fs'),
	Q = require('q'),
	process = require('process'),
	path = require('path');

var _app,
	_routes,
	_configDirector;

function HomeController (app, configDirector, routes) {
	_app = app;
	_routes = routes;
	_configDirector = configDirector;
}

HomeController.prototype.init = function() {
	_app.get("/", function(req, res) {
		_configDirector
			.isDbInitializedAsync()
			//.checkFileConfigExistsAsync()
			.then(function(exists) {
				if (exists) {
					// TODO Check for valid db/connection settings/ having root user account before move to setup
					res.render("index", { user: req.user });
				} else {
					res.redirect("/setup");
				}
			});
	});

	_app.get(_routes.api, function(req, res) {
		res.send(_routes.components);
	});
};

module.exports = HomeController;