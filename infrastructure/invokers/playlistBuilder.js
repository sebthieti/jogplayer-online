'use strict';

var path = require('path'),
	Playlist = require('../models').Playlist;

module.exports = {
	buildEmptyPhysicalPlaylist: function (playlistFilePath, name) {
		var playlistName = '';
		if (name) {
			playlistName = name;
		} else {
			var plExtention = path.extname(playlistFilePath);
			playlistName = path.basename(playlistFilePath, plExtention);
		}

		return new Playlist(
			null,
			playlistName,
			true,
			playlistFilePath,
			null,
			new Date().toUTCString(),
			null
		);
	},

	buildEmptyVirtualPlaylist: function (name, index) {
		return this.buildVirtualPlaylist(name, index);
	},

	buildVirtualPlaylist: function (name, index) {
		return new Playlist({
			name: name,
			index: index,
			filePath: '',
			checked: true,
			mustRelocalize: false,
			createdOn: new Date().toUTCString()
		});
	}
};