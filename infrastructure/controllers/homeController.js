'use strict';

var _app,
	_routes;

function HomeController (app, routes) {
	_app = app;
	_routes = routes;
}

HomeController.prototype.init = function() {
	_app.get("/", function(req, res) {
		res.render("index");
	});

	_app.get(_routes.api, function(req, res) {
		res.send(_routes.components);
	});
};

module.exports = HomeController;