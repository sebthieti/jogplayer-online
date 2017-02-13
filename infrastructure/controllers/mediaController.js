module.exports = (function() {
	'use strict';

	var _app,
		_mediaStreamer;

	function MediaController (app, mediaStreamer) {
		_app = app;
		_mediaStreamer = mediaStreamer;
	}

	MediaController.prototype.init = function() {
		_app.get('/api/medias/play/:mediaIdWithExt', function (req, res) {
			var mediaIdWithExt = req.params.mediaIdWithExt;
			_mediaStreamer.streamByMediaIdAndExt(mediaIdWithExt, req, res);
		});

		// Read media with given file path.
		_app.get(/^\/api\/medias\/playByFilePath\/(.*[^\/])$/, function (req, res) {
			var mediaPath = decodeURI(req.params[0]);
			_mediaStreamer.streamByMediaPath(mediaPath, req, res);
		});
	};

	return MediaController;
}());