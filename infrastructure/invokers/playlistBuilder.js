'use strict';

var path = require('path');

var Playlist;

var PlaylistBuilder = function (playlistModel) {
	Playlist = playlistModel;
}

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
			mustRelocalize: false,
			createdOn: new Date().toUTCString()
		});
	},

	buildEmptyPhysicalPlaylist: function (playlistFilePath, name, index) {
		var playlistName = '';
		if (name) {
			playlistName = name;
		} else {
			var plExt = path.extname(playlistFilePath);
			playlistName = path.basename(playlistFilePath, plExt);
		}

		return new Playlist({
			name: playlistName,
			index: index,
			filePath: playlistFilePath,
			checked: true,
			mustRelocalize: false,
			createdOn: new Date().toUTCString()
		});
	}

};

module.exports = PlaylistBuilder;