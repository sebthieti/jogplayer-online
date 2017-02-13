'use strict';

var Q = require('q'),
	PlaylistDto = require('../dto').PlaylistDto;

var _app,
	_playlistDirector,
	_playlistsDirector,
	_authDirector,
	_plRoutes,
	_mediaRoutes;

function assertAndGetPlaylistId(obj) {
	if (!obj || !obj.playlistId) {
		throw 'Id must be set.';
	}
	return obj.playlistId;
}

function assertAndGetPlaylistIdsAndSteps(obj) {
	var playlistIds = obj.ids;
	var steps = obj.steps;

	if (!playlistIds || !steps) {
		throw 'ids or steps have not been providen.';
	}
	return { playlistIds: playlistIds, steps: steps }
}

function assertAndGetPlaylistIdAndMediaId(obj) {
	var playlistId = obj.playlistId;
	var mediumId = obj.mediumId;

	if (!playlistId || !mediumId) {
		throw 'playlistId or mediumId have not been providen.';
	}
	return { playlistId: playlistId, mediumId: mediumId }
}

function assertMediumInsertParamsFromRequest(request) {
	// TODO For all assertion enforce each type (ex mediaFilePath must be string not array of string)
	var playlistId = request.params.playlistId;
	var insertPosition = request.body.index;
	var mediaFilePath = request.body.mediaFilePath;

	if (!playlistId || insertPosition === undefined || insertPosition === null || !mediaFilePath) {
		throw "Playlist object doesn't have all mandatory fields."
	}

	var data = {
		playlistId: playlistId,
		mediaFilePath: mediaFilePath
	};

	if (insertPosition === 'end') {
		data.insertPosition = 'end';
	} else if (!isNaN(insertPosition)) {
		var index = parseInt(insertPosition);
		data.insertPosition = index;
	} else {
		throw "insertPosition is not in a valid range."
	}

	return data;
}

function registerPlaylistRoutes() {
	_app.get(_plRoutes.getPath, _authDirector.ensureApiAuthenticated, function(req, res) {
		_playlistsDirector
			.getPlaylistsAsync(req.user)
			.then(function(data) { res.send(data) })
			.catch(function(err) { res.status(400).send(err) })
			.done();
	});

	_app.patch(_plRoutes.actions.movePath, _authDirector.ensureApiAuthenticated, function(req, res) {
		Q.fcall(assertAndGetPlaylistIdsAndSteps, req.body)
		.then(function(reqSet) {
			return _playlistsDirector.movePlaylistsAsync(reqSet.playlistIds, reqSet.steps, req.user);
		})
		.then(function(data) { res.status(200).send(data) })
		.catch(function(err) { res.status(400).send(err) })
		.done();
	});

	_app.patch(_plRoutes.updatePath, _authDirector.ensureApiAuthenticated, function(req, res) {
		Q.fcall(assertAndGetPlaylistId, req.params)
		.then(function (playlistId) {
			return {
				playlistId: playlistId,
				playlist: PlaylistDto.toDto(req.body, playlistId)
			}
		})
		.then(function (reqSet) {
			return _playlistDirector.updatePlaylistAsync(
				reqSet.playlistId,
				reqSet.playlist,
				req.user
			);
		})
		.then(function(data) { res.status(200).send(data) })
		.catch(function(err) { res.status(400).send(err) })
		.done();
	});

	_app.post(_plRoutes.insertPath, _authDirector.ensureApiAuthenticated, function(req, res) {
		Q.fcall(PlaylistDto.toDto, req.body)
		.then(function (playlist) {
			return (playlist.index == null)
				? _playlistsDirector.addPlaylistAsync(playlist, req.user)
				: _playlistsDirector.insertPlaylistAsync(playlist, playlist.index, req.user);
		})
		.then(function(newPlaylist) { res.send(newPlaylist) })
		.catch(function(err) { res.status(400).send(err) })
		.done();
	});

	_app.delete(_plRoutes.delete.path, _authDirector.ensureApiAuthenticated, function(req, res) {
		Q.fcall(assertAndGetPlaylistId, req.params)
		.then(function(playlistId) {
			return _playlistsDirector.removePlaylistAsync(playlistId, req.user)
		})
		.then(function() { res.sendStatus(204) })
		.catch(function(err) { res.status(400).send(err) })
		.done();
	});
}

function registerPlaylistMediaRoutes() {
	_app.get(_plRoutes.listMedia, _authDirector.ensureApiAuthenticated, function(req, res) {
		Q.fcall(assertAndGetPlaylistId, req.params)
		.then(function(playlistId) {
			return _playlistDirector.getMediaFromPlaylistByIdAsync(playlistId, req.user);
		})
		.then(function(data) { res.send(data) })
		.catch(function(err) { res.status(400).send(err) })
		.done();
	});

	_app.post(_mediaRoutes.insertPath, _authDirector.ensureApiAuthenticated, function(req, res) {
		Q.fcall(assertMediumInsertParamsFromRequest, req)
			.then(function (reqSet) {
				return (reqSet.insertPosition === 'end')
					? _playlistDirector.addMediumByFilePathAsync( // TODO Like for everything i should return a Dto, not model (mediumDto)
						reqSet.playlistId,
						reqSet.mediaFilePath,
						req.user)
					: _playlistDirector.insertMediumByFilePathAsync(
						reqSet.playlistId,
						reqSet.mediaFilePath,
						reqSet.insertPosition,
						req.user)
			})
			.then(function(newMedia) { res.send(newMedia) })
			.catch(function(err) { res.status(400).send(err) })
			.done();
	});

	_app.delete(_mediaRoutes.deletePath, _authDirector.ensureApiAuthenticated, function(req, res) {
		Q.fcall(assertAndGetPlaylistIdAndMediaId, req.params)
		.then(function(reqSet) {
			return _playlistDirector.removeMediaAsync(reqSet.playlistId, reqSet.mediumId, req.user)
		})
		.then(function() { res.sendStatus(204) })
		.catch(function(err) { res.status(400).send(err) })
		.done();
	});
}

function PlaylistController(app, plRoutes, mediaRoutes, playlistDirector, playlistsDirector, authDirector) {
	_app = app;
	_plRoutes = plRoutes;
	_mediaRoutes = mediaRoutes;
	_playlistDirector = playlistDirector;
	_playlistsDirector = playlistsDirector;
	_authDirector = authDirector;
}

PlaylistController.prototype.init = function() {
	registerPlaylistRoutes();
	registerPlaylistMediaRoutes();
};

module.exports = PlaylistController;