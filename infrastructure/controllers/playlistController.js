'use strict';

var playlistValidation = require('../validators').playlistValidation;

var _app,
	_playlistDirector,
	_playlistsDirector,
	_plRoutes,
	_mediaRoutes;

function PlaylistController (app, plRoutes, mediaRoutes, playlistDirector, playlistsDirector) {
	_app = app;
	_plRoutes = plRoutes;
	_mediaRoutes = mediaRoutes;
	_playlistDirector = playlistDirector;
	_playlistsDirector = playlistsDirector;
}

PlaylistController.prototype.init = function() {
	registerPlaylistRoutes();
	registerPlaylistMediaRoutes();
};

var registerPlaylistRoutes = function () {
	_app.get(_plRoutes.getPath, function(req, res) {
		_playlistsDirector
			.getPlaylistsAsync()
			.then(function(data) { res.send(data) })
			.catch(function(err) { res.send(400, err) })
			.done();
	});

	_app.put(_plRoutes.actions.movePath, function(req, res) {
		var playlistIds = req.body.ids;
		var steps = req.body.steps;

		if (!playlistIds || !steps) {
			res.send(400, "ids or steps have not been providen.");
			return;
		}

		_playlistsDirector
			.movePlaylistsAsync(playlistIds, steps)
			.then(function(data) { res.send(200, data) })
			.catch(function(err) { res.send(400, err) })
			.done();
	});

	_app.put(_plRoutes.updatePath, function(req, res) {
		var playlistId = req.params.playlistId;

//			if (!playlistId || !steps) {
//				res.send(400, "ids or steps have not been providen.");
//				return;
//			}

		_playlistsDirector
			.updatePlaylistAsync(playlistId, req.body)
			.then(function(data) { res.send(200, data) })
			.catch(function(err) { res.send(400, err) })
			.done();
	});

	_app.post(_plRoutes.insertPath, function(req, res) {
		var playlist = req.body;
		if (!playlistValidation.isValidDto(playlist)) { // TODO makeConform
			res.send(400, "Playlist object doesn't have all mandatory fields.");
			return;
		}

		if (playlist.index != null) {
			_playlistsDirector
				.insertPlaylistAsync(playlist, playlist.index)
				.then(function(newPlaylist) { res.send(newPlaylist) })
				.catch(function(err) { res.send(400, err) })
				.done();
		} else {
			_playlistsDirector
				.addPlaylistAsync(playlist)
				.then(function(newPlaylist) { res.send(newPlaylist) })
				.catch(function(err) { res.send(400, err) })
				.done();
		}
	});

	_app.delete(_plRoutes.delete.pattern, function(req, res) {
		var playlistIds = null;
		if (req.params.length > 0) {
			playlistIds = [ req.params[0] ];
		} else {
			playlistIds = req.body.ids;
		}

		if (playlistIds === undefined) {
			res.send(400, "Id must be set.");
			return;
		}

		_playlistsDirector
			.removePlaylistsAsync(playlistIds)
			.then(function() { res.send(204) })
			.catch(function(err) { res.send(400, err) })
			.done();
	});
};

var registerPlaylistMediaRoutes = function () {
	_app.get(_plRoutes.listMedia, function(req, res) {
		_playlistDirector
			.getMediaFromPlaylistByIdAsync(req.params.playlistId)
			.then(function(data) { res.send(data) })
			.catch(function(err) { res.send(400, err) })
			.done();
	});

	_app.post(_mediaRoutes.insertPath, function(req, res) {
//			if (!playlistValidation.isValidDto(playlist)) { // TODO makeConform
//				res.send(400, "Playlist object doesn't have all mandatory fields.");
//				return;
//			}
		var playlistId = req.params.playlistId;
		var insertPosition = req.body.index;
		var mediaFilePaths = req.body.mediaFilePaths;

		if (insertPosition === 'end') {
			_playlistDirector
				.addMediaByFilePathAsync(playlistId, mediaFilePaths)
				.then(function(newMedia) { res.send(newMedia) })
				.catch(function(err) { res.send(400, err) })
				.done();
		} else {
			var index = parseInt(insertPosition);
			if (!isNaN(index)) {
				_playlistDirector
					.insertMediaByFilePathAsync(playlistId, mediaFilePaths, index)
					.then(function(newMedia) { res.send(newMedia) })
					.catch(function(err) { res.send(400, err) })
					.done();
			}
		}
	});

	_app.put(_mediaRoutes.updatePath, function(req, res) {

	});

	_app.delete(_mediaRoutes.deletePath, function(req, res) {
		var playlistId = req.params.playlistId;
		var mediaId = req.params.mediaId;

		_playlistDirector
			.removeMediaAsync(playlistId, mediaId)
			.then(function() { res.send(204) })
			.catch(function(err) { res.send(400, err) })
			.done();
	});
};

module.exports = PlaylistController;