'use strict';

var fs = require('fs'),
	os = require('os'),
	Q = require('q'),
	//m3uWriter = require("m3u"),
	from = require('fromjs'),
	path = require('path'),
	pathBuilder = require('../utils').pathBuilder;

var EXTENDED = "#EXTM3U",
	_mediaBuilder;

function M3UPlaylistService(mediaBuilder) {
	_mediaBuilder = mediaBuilder;
}

M3UPlaylistService.prototype.loadMediasFromPlaylistAsync = function (filePath) {
	return readPlaylistAsync(filePath)
		.then(function(playlistContent) {
			return parsePlaylist(playlistContent, filePath)
		});
};

M3UPlaylistService.prototype.isOfType = function(filePath) {
	var ext = path.extname(filePath).toLowerCase();
	return ext == ".m3u" || ext == ".m3u8";
};

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
			pathBuilder.toAbsolutePath(filePath, mediaPath),
			title,
			duration);

		medias.push(media);
	}

	return medias;
};

module.exports = M3UPlaylistService;