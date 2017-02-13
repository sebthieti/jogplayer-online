var PlaylistBusiness = (function () {
	'use strict';

	function PlaylistBusiness (playlistDirector) {

		this.getPlaylistContentAsync = function (playlistId) {
			return playlistDirector.getPlaylistContentAsync(playlistId);
		};

		this.addMediasAsync = function (playlistId, filePaths) {
			return playlistDirector.addMediasAsync(playlistId, filePaths);
		};

		this.insertMediaAsync = function (playlistId, filePaths, index) {
			if (index == null) {
				return playlistDirector.addMediaAsync(playlistId, filePaths);
			} else {
				return playlistDirector.insertMediaAsync(playlistId, filePaths, index);
			}
		};

		this.nextMediaAsync = function () { // TODO Should be 'sendNextMedia' ?
		};

		this.previousMediaAsync = function () {
		};

		this.moveMediasAsync = function(playlistId, mediaIds, steps) {
		};

		this.selectPlaylist = function (playlist, isSelected) { // TODO To mirror user choice in UI
		};
	}

	return PlaylistBusiness;
})();

module.exports = PlaylistBusiness;