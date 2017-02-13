'use strict';

var path = require('path'),
	fs = require('fs'),
	Q = require('q');

var Playlist,
	_fileExplorerService;

var PlaylistBuilder = function (playlistModel, fileExplorerService) {
	Playlist = playlistModel;
	_fileExplorerService = fileExplorerService;
};

PlaylistBuilder.prototype = {

	buildEmptyVirtualPlaylist: function (name, index) {
		return this.buildVirtualPlaylist(name, index);
	},

	buildVirtualPlaylist: function (name, index) {
		return new Playlist({
			name: name,
			index: index,
			filePath: '',
			checked: true,
			isAvailable: true,
			createdOn: new Date().toUTCString()
		});
	},

	buildEmptyPhysicalPlaylistAsync: function (playlistFilePath, name, index) {
		var normalizedPlaylistFilePath = _fileExplorerService.normalizePathForCurrentOs(playlistFilePath);
		var playlistName = '';
		if (name) {
			playlistName = name;
		} else {
			var plExt = path.extname(normalizedPlaylistFilePath);
			playlistName = path.basename(normalizedPlaylistFilePath, plExt);
		}

		return Q
			.nfcall(fs.stat, normalizedPlaylistFilePath)
			.then(function(stat) {
				return new Playlist({
					name: playlistName,
					index: index,
					filePath: normalizedPlaylistFilePath,
					checked: true,
					isAvailable: true,
					createdOn: stat.ctime,
					updatedOn: stat.mtime
				});
			});
	}

};

module.exports = PlaylistBuilder;