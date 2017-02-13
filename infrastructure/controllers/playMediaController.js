'use strict';

var _app,
	_mediaStreamer,
	_mediaRoutes,
	_fileRoute;

function PlayMediaController (app, mediaRoutes, fileRoute, mediaStreamer) {
	_app = app;
	_mediaRoutes = mediaRoutes;
	_fileRoute = fileRoute;
	_mediaStreamer = mediaStreamer;
}

PlayMediaController.prototype.init = function() {
	_app.get(_mediaRoutes.selfPlay, function (req, res) {
		var mediaIdWithExt = req.params.mediaIdWithExt;
		_mediaStreamer.streamByMediaIdAndExt(mediaIdWithExt, req, res);
	});

	// Read media with given file path.
	_app.get(_fileRoute.selfPlayPattern, function (req, res) {
		var mediaPath = req.params[0];
		_mediaStreamer.streamByMediaPath(mediaPath, req, res);
	});
};

module.exports = PlayMediaController;