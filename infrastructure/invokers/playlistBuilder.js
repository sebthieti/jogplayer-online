var path = require('path');
var Playlist = require('../entities/playlist');

var PlaylistBuilder = (function () {
	'use strict'

	var PlaylistBuilder = this;

	function buildEmptyPhysicalPlaylist (playlistFilePath, name) {
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
	}

//	function buildEmptyVirtualPlaylist (name, index) {
//		return PlaylistBuilder.buildVirtualPlaylist(null, name, index);
//	}

	function buildVirtualPlaylist (id, name, index) {
		return new Playlist(
			id,
			index,
			name,
			null,
			true,
			new Date().toUTCString(),
			null,
			[]
		);
	}

	return {
		buildEmptyPhysicalPlaylist: buildEmptyPhysicalPlaylist,
		//buildEmptyVirtualPlaylist: buildEmptyVirtualPlaylist,
		buildVirtualPlaylist: buildVirtualPlaylist
	}
})();

module.exports = PlaylistBuilder;