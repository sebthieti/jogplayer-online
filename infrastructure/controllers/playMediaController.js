'use strict';

var _app,
	_mediaStreamer,
	_mediaRoutes,
	_fileRoute,
	_authDirector;

function PlayMediaController (app, mediaRoutes, fileRoute, mediaStreamer, authDirector) {
	_app = app;
	_mediaRoutes = mediaRoutes;
	_fileRoute = fileRoute;
	_mediaStreamer = mediaStreamer;
	_authDirector = authDirector;
}

PlayMediaController.prototype.init = function() {
	_app.get(_mediaRoutes.selfPlay, _authDirector.ensureApiAuthenticated, function (req, res) {
		var mediaIdWithExt = req.params.mediaIdWithExt;
		_mediaStreamer.streamByMediaIdAndExt(mediaIdWithExt, req, res);
	});

	// Read media with given file path.
	_app.get(_fileRoute.selfPlayPattern, _authDirector.ensureApiAuthenticated, function (req, res) {
		var mediaPath = req.params[0];
		_mediaStreamer.streamByMediaPath(mediaPath, req, res);
	});
};

module.exports = PlayMediaController;