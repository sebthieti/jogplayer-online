'use strict';

var _app,
	_mediaRoutes,
	_authDirector;

function StateController (app, mediaRoutes, authDirector) {
	_app = app;
	_mediaRoutes = mediaRoutes;
	_authDirector = authDirector
}

StateController.prototype.init = function() {
	_app.get('/api/states/:userId', _authDirector.ensureApiAuthenticated, function (req, res) {
		res.send({
			mediaQueue: []
		});
	});
};

module.exports = StateController;