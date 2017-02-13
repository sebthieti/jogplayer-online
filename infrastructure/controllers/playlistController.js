var playlistValidation = require('../validators').playlistValidation;

module.exports = (function() {
	'use strict';

	var _app,
		_playlistDirector,
		_playlistsDirector;

	function PlaylistController (app, playlistDirector, playlistsDirector) {
		_app = app;
		_playlistDirector = playlistDirector;
		_playlistsDirector = playlistsDirector;
	}

	PlaylistController.prototype.init = function() {
		_app.get('/api/playlists/', function(req, res) {
			_playlistsDirector
				.getPlaylistsAsync()
				.then(function(data) { return res.send(data) })
				.catch(function(err) { res.send(400, err) })
				.done();
		});

		_app.get('/api/playlists/:id', function(req, res) {
			_playlistDirector
				.getMediasFromPlaylistByIdAsync(req.params.id)
				.then(function(data) { return res.send(data)})
				.catch(function(err) { res.send(400, err) })
				.done();
		});

		_app.put('/api/actions/playlists/move/', function(req, res) {
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

		_app.post('/api/playlists/', function(req, res) {
			var playlist = req.body;
			if (!playlistValidation.isValidDto(playlist)) { // TODO makeConform
				res.send(400, "Playlist object doesn't have all mandatory fields.");
				return;
			}

			if (playlist.index != null) {
				_playlistsDirector
					.insertPlaylistAsync(playlist, playlist.index)
					.then(res.send)
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

		_app.delete(/^\/api\/playlists\/(\w+)?$/, function(req, res) {
			var playlistIds = null;
			if (req.params.id !== undefined) {
				playlistIds = [req.params.id];
			} else {
				playlistIds = req.body.ids;
			}

			if (playlistIds === undefined) {
				res.send(400, "Id must be set.");
				return;
			}

			_playlistsDirector
				.removePlaylistsAsync(playlistIds)
				.then(function() { res.send(200) })
				.catch(function(err) { res.send(400, err) })
				.done();
		});		
	};

	return PlaylistController;
}());