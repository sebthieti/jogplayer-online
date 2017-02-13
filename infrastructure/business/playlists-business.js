var PlaylistsBusiness = (function () {
	'use strict';

	function PlaylistsBusiness (playlistsDirector) {

		this.getPlaylistsAsync = function () {
			return playlistsDirector.getPlaylistsAsync();
		};

		this.addPlaylistAsync = function (playlist) {
			if (!playlist.filePath || playlist.filePath == null) {				
				return playlistsDirector.addVirtualPlaylistAsync(playlist);
			} else {
				return playlistsDirector.addPhysicalPlaylistAsync(playlist);
			}
		};

		this.insertPlaylistAsync = function (playlist, index) {
			if (!playlist.filePath || playlist.filePath == null) {				
				return playlistsDirector.insertVirtualPlaylistAsync(playlist, index);
			} else {
				return playlistsDirector.insertPhysicalPlaylistAsync(playlist, index);
			}
		};	

		this.movePlaylistsAsync = function (playlistIds, steps) {
			return playlistsDirector.movePlaylistsAsync(playlistIds, steps);
		};

		this.removePlaylistsAsync = function (playlistIds) {
			return playlistsDirector.removePlaylistsAsync(playlistIds);
		};

		this.moveMediasToPlaylistAsync = function (srcPlaylistId, mediaIds, destPlaylistId) {
			return playlistsDirector.moveMediasToPlaylistAsync(srcPlaylistId, mediaIds, destPlaylistId);
		};

		this.copyMediasToPlaylistAsync = function(srcPlaylistId, mediaIds, destPlaylistId) {
			return playlistsDirector.copyMediasToPlaylistAsync(srcPlaylistId, mediaIds, destPlaylistId);
		};
	}

	return PlaylistsBusiness;
})();

module.exports = PlaylistsBusiness;