'use strict';

var Q = require('q'),
	PlaylistDto = require('../dto').PlaylistDto;

var _app,
	_playlistDirector,
	_playlistsDirector,
	_plRoutes,
	_mediaRoutes;

var assertAndGetPlaylistId = function (obj) {
	if (!obj || !obj.playlistId) {
		throw 'Id must be set.';
	}
	return obj.playlistId;
};

var assertAndGetPlaylistIdsAndSteps = function (obj) {
	var playlistIds = obj.ids;
	var steps = obj.steps;

	if (!playlistIds || !steps) {
		throw 'ids or steps have not been providen.';
	}
	return { playlistIds: playlistIds, steps: steps }
};

var assertAndGetPlaylistIdAndMediaId = function (obj) {
	var playlistId = obj.playlistId;
	var mediaId = obj.mediaId;

	if (!playlistId || !mediaId) {
		throw 'playlistId or mediaId have not been providen.';
	}
	return { playlistId: playlistId, mediaId: mediaId }
};

var assertMediumInsertParamsFromRequest = function (request) {
	// TODO For all assertion enforce each type (ex mediaFilePath must be string not array of string)
	var playlistId = request.params.playlistId;
	var insertPosition = request.body.index;
	var mediaFilePath = request.body.mediaFilePath;

	if (!playlistId || !insertPosition || !mediaFilePath) {
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
};

var registerPlaylistRoutes = function () {
	_app.get(_plRoutes.getPath, function(req, res) {
		_playlistsDirector
			.getPlaylistsAsync()
			.then(function(data) { res.send(data) })
			.catch(function(err) { res.send(400, err) })
			.done();
	});

	_app.patch(_plRoutes.actions.movePath, function(req, res) {
		Q.fcall(assertAndGetPlaylistIdsAndSteps, req.body)
		.then(function(reqSet) {
			return _playlistsDirector.movePlaylistsAsync(reqSet.playlistIds, reqSet.steps);
		})
		.then(function(data) { res.send(200, data) })
		.catch(function(err) { res.send(400, err) })
		.done();
	});

	_app.patch(_plRoutes.updatePath, function(req, res) {
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
				reqSet.playlist
			);
		})
		.then(function(data) { res.send(200, data) })
		.catch(function(err) { res.send(400, err) })
		.done();
	});

	_app.post(_plRoutes.insertPath, function(req, res) {
		Q.fcall(PlaylistDto.toDto, req.body)
		.then(function (playlist) {
			return (playlist.index == null)
				? _playlistsDirector.addPlaylistAsync(playlist)
				: _playlistsDirector.insertPlaylistAsync(playlist, playlist.index);
		})
		.then(function(newPlaylist) { res.send(newPlaylist) })
		.catch(function(err) { res.send(400, err) })
		.done();
	});

	_app.delete(_plRoutes.delete.path, function(req, res) {
		Q.fcall(assertAndGetPlaylistId, req.params)
		.then(_playlistsDirector.removePlaylistAsync)
		.then(function() { res.send(204) })
		.catch(function(err) { res.send(400, err) })
		.done();
	});
};

var registerPlaylistMediaRoutes = function () {
	_app.get(_plRoutes.listMedia, function(req, res) {
		Q.fcall(assertAndGetPlaylistId, req.params)
		.then(_playlistDirector.getMediaFromPlaylistByIdAsync)
		.then(function(data) { res.send(data) })
		.catch(function(err) { res.send(400, err) })
		.done();
	});

	_app.post(_mediaRoutes.insertPath, function(req, res) {
		Q.fcall(assertMediumInsertParamsFromRequest, req)
			.then(function (reqSet) {
				return (reqSet.insertPosition === 'end')
					? _playlistDirector.addMediumByFilePathAsync( // TODO Like for everything i should return a Dto, not model (mediumDto)
						reqSet.playlistId,
						reqSet.mediaFilePath)
					: _playlistDirector.insertMediumByFilePathAsync(
						reqSet.playlistId,
						reqSet.mediaFilePath,
						reqSet.index)
			})
			.then(function(newMedia) { res.send(newMedia) })
			.catch(function(err) { res.send(400, err) })
			.done();
	});

	_app.delete(_mediaRoutes.deletePath, function(req, res) {
		Q.fcall(assertAndGetPlaylistIdAndMediaId, req.params)
		.then(function(reqSet) {
			return _playlistDirector.removeMediaAsync(reqSet.playlistId, reqSet.mediaId)
		})
		.then(function() { res.send(204) })
		.catch(function(err) { res.send(400, err) })
		.done();
	});
};

var PlaylistController = function (app, plRoutes, mediaRoutes, playlistDirector, playlistsDirector) {
	_app = app;
	_plRoutes = plRoutes;
	_mediaRoutes = mediaRoutes;
	_playlistDirector = playlistDirector;
	_playlistsDirector = playlistsDirector;
};

PlaylistController.prototype.init = function() {
	registerPlaylistRoutes();
	registerPlaylistMediaRoutes();
};

module.exports = PlaylistController;