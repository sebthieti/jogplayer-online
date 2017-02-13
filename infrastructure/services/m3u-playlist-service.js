var fs = require('fs');
var os = require('os');
var Q = require('q');
var m3uWriter = require("m3u");
var from = require('fromjs');
var path = require('path');
var PathBuilder = require('../utils/path-builder');

var M3UPlaylistService = (function () {
	'use strict'

	var EXTENDED = "#EXTM3U";

	function M3UPlaylistService(mediaBuilder) {

		this.loadMediasFromPlaylistAsync = function (filePath) {
			return readPlaylistAsync(filePath)
				.then(function(playlistContent) {
					return parsePlaylist(playlistContent, filePath)
				});
		}

		function readPlaylistAsync (filePath) {
			return Q.nfcall(fs.readFile, filePath, { encoding: "utf8" })
		}

		function parsePlaylist (playlistContent, filePath) {
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

				var media = mediaBuilder.buildMediaSummary(
					PathBuilder.toAbsolutePath(filePath, mediaPath),
					title,
					duration);

				medias.push(media);
			}

			return medias;
		}
	}

	M3UPlaylistService.prototype.isOfType = function(filePath) {
		var ext = path.extname(filePath).toLowerCase();
		return ext == ".m3u" || ext == ".m3u8";
	}

	return M3UPlaylistService;

})();

module.exports = M3UPlaylistService;