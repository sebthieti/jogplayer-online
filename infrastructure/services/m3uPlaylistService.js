'use strict';

var fs = require('fs'),
	os = require('os'),
	Q = require('q'),
	//m3uWriter = require("m3u"),
	from = require('fromjs'),
	path = require('path');

var EXTENDED = "#EXTM3U",
	_mediaBuilder,
	_fileExplorer,
	_pathBuilder;

var readPlaylistAsync = function (filePath) {
	return Q.nfcall(fs.readFile, filePath, { encoding: "utf8" })
};

var parsePlaylist = function (playlistContent, filePath) {
	var playlistContentParsed = from(playlistContent.split(os.EOL))
		.skipWhile(function(c) { return c.indexOf(EXTENDED) != -1 })
		.skip(1) // skip EXTENDED
		.toArray();

	var medias = [];
	for (var lineIndex = 0; lineIndex < playlistContentParsed.length; lineIndex++) {
		var mediaFirstLine = playlistContentParsed[lineIndex];
		if (!mediaFirstLine) {
			continue;
		}

		var durationAndTitle = mediaFirstLine
			.slice(mediaFirstLine.indexOf(':') + 1)
			.split(',');

		var durationStr = durationAndTitle[0];
		var duration = parseInt(durationStr, 0);
		if (isNaN(duration)) {
			duration = -1;
		}

		var title = durationAndTitle[1];

		lineIndex++;

		var mediaPath = playlistContentParsed[lineIndex];

		var media = _mediaBuilder.buildMediaSummary(
			_pathBuilder.toAbsolutePath(filePath, mediaPath),
			title,
			medias.length,
			duration);

		medias.push(media);
	}

	return medias;
};

var generateLine = function(title, duration) {
	return '#EXTINF:' + Math.round(duration) + ',' + title;
};

var savePlaylistAsync = function(playlist) {
	var lines = new Array(playlist.media.length * 2 + 1); // 2 lines per title + header
	lines[0] = EXTENDED;
	var cursor = 0;
	playlist.media.forEach(function(medium) {
		lines[++cursor] = generateLine(medium.title, medium.duration);
		lines[++cursor] = _pathBuilder.toRelativePath(playlist.filePath, medium.filePath);
	});

	var linesToString = lines.join(_fileExplorer.getNewLineConstant());
	return Q
		.nfcall(fs.writeFile, playlist.filePath, linesToString)
		.then(function() {return playlist});
};

var M3UPlaylistService = function (mediaBuilder, fileExplorer, pathBuilder) {
	_mediaBuilder = mediaBuilder;
	_fileExplorer = fileExplorer;
	_pathBuilder = pathBuilder;
};

M3UPlaylistService.prototype = {

	loadMediaSummariesFromPlaylistAsync: function (filePath) {
		return readPlaylistAsync(filePath)
			.then(function(playlistContent) {
				return parsePlaylist(playlistContent, filePath)
			});
	},

	savePlaylistAsync: savePlaylistAsync,

	isOfType: function(filePath) {
		var ext = path.extname(filePath).toLowerCase();
		return ext == ".m3u" || ext == ".m3u8";
	}

};

module.exports = M3UPlaylistService;