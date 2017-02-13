var PlaylistBusiness = (function () {
	'use strict';

	function PlaylistBusiness (playlistDirector) {

		this.getPlaylistWithMediasAsync = function (playlistId) {
			return playlistDirector.getMediasFromPlaylistByIdAsync(playlistId);
		};

		this.addMediasAsync = function (medias, playlistId) {
			return playlistDirector.addMediasAsync(playlistId, filePaths);
		};

		this.insertMediasAsync = function (medias, playlistId, index) {
			if (index == null) {
				return playlistDirector.addMediasAsync(medias, playlistId);
			} else {
				return playlistDirector.insertMediasAsync(medias, playlistId, index);
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