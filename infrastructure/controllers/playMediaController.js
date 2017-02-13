'use strict';

var Q = require('q');
var _app,
	_mediaStreamer,
	_mediaRoutes,
	_fileRoute,
	_authDirector,
	_mediaDirector;

function assertAndGetPlaylistIdsAndMediumId(params) {
	var playlistId = params.playlistId;
	var mediumId = params.mediumId;

	if (!playlistId || !mediumId) {
		throw new Error('playlistId or mediumId have not been provided.');
	}
	return { playlistId: playlistId, mediumId: mediumId }
}


function PlayMediaController (app, mediaRoutes, fileRoute, mediaStreamer, authDirector, mediaDirector) {
	_app = app;
	_mediaRoutes = mediaRoutes;
	_fileRoute = fileRoute;
	_mediaStreamer = mediaStreamer;
	_authDirector = authDirector;
	_mediaDirector = mediaDirector;
}

PlayMediaController.prototype.init = function() {
	_app.get(_mediaRoutes.selfPath, _authDirector.ensureApiAuthenticated, function (req, res) {
		Q.fcall(assertAndGetPlaylistIdsAndMediumId, req.params)
			.then(function(reqSet) {
				return _mediaDirector.getMediumByIdAndPlaylistIdAsync(reqSet.playlistId, reqSet.mediumId, req.user);
			})
			.then(function(data) { res.status(200).send(data) })
			.catch(function(err) { res.status(400).send(err) })
			.done();
	});

	_app.get(_mediaRoutes.selfPlay, _authDirector.ensureApiAuthenticated, function (req, res) {
		var mediumIdWithExt = req.params.mediumIdWithExt;
		_mediaStreamer.streamByMediaIdAndExt(mediumIdWithExt, req, res);
	});

	// Read media with given file path.
	_app.get(_fileRoute.selfPlayPattern, _authDirector.ensureApiAuthenticated, function (req, res) {
		var mediaPath = req.params[0];
		_mediaStreamer.streamByMediaPath(mediaPath, req, res);
	});
};

module.exports = PlayMediaController;