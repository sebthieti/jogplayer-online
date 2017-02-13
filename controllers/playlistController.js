var PlaylistValidation = require('../infrastructure/validation/playlist-validation');
var Media = require('../infrastructure/entities/medias/media').Media;

(function(playlistController) {
	'use strict'

	// TODO: No file paths for pl/media in returned json
	playlistController.init = function(app, playlistsBusiness) {

		app.get('/api/playlists/', function(req, res) {
			playlistsBusiness
				.getPlaylistsAsync()
				.then(function(pls) { res.send(pls) })
				.catch(function(err) { res.send(400, err) })
				.done();
		});

		app.post('/api/actions/playlists/move/', function(req, res) {
			var playlistIds = req.body.ids;
			var steps = req.body.steps;

			if (!playlistIds || !steps) {
				res.send(400, "ids or steps have not been providen.");
				return;
			}

			playlistsBusiness
				.movePlaylistsAsync(playlistIds, steps)
				.then(function(newPlaylist) { res.send(newPlaylist) })
				.catch(function(err) { res.send(400, err) })
				.done();
		});

		app.put('/api/playlists/', function(req, res) {
			var playlist = req.body;
			if (!PlaylistValidation.isValidDto(playlist)) { // TODO makeConform
				res.send(400, "Playlist object doesn't have all mandatory fields.");
				return;
			}

			if (playlist.index != null) {
				playlistsBusiness
					.insertVirtualPlaylistAsync(playlist, playlist.index)
					.then(function(newPlaylist) { res.send(newPlaylist) })
					.catch(function(err) { res.send(400, err) })
					.done();
			} else {
				playlistsBusiness
					.addVirtualPlaylistAsync(playlist)
					.then(function(newPlaylist) { res.send(newPlaylist) })
					.catch(function(err) { res.send(400, err) })
					.done();
			}
		});

		app.delete(/^\/api\/playlists\/(\w+)?$/, function(req, res) {
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

			playlistsBusiness
				.removePlaylistsAsync(playlistIds)
				.then(function(allPlaylists) { res.send(allPlaylists) })
				.catch(function(err) { res.send(400, err) })
				.done();
		});
	}

})(module.exports);