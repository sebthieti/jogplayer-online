var PlaylistsBusiness = (function () {
	'use strict';

	function PlaylistsBusiness (playlistsDirector) {

		this.getPlaylistsAsync = function () {
			return playlistsDirector.getPlaylistsAsync();
		};

		this.addPlaylistAsync = function (playlist) {
			return playlistsDirector.addVirtualPlaylistAsync(playlist);
		};

		this.insertPlaylistAsync = function (playlist, index) {
			return playlistsDirector.insertVirtualPlaylistAsync(playlist, index);
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
		}
	}

	return PlaylistsBusiness;
})();

module.exports = PlaylistsBusiness;