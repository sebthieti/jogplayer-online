'use strict';

var _app;

function HomeController (app) {
	_app = app;
}

HomeController.prototype.init = function() {
	_app.get("/", function(req, res) {
		res.render("index");
	});
};

module.exports = HomeController;