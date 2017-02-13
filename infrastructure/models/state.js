var State = (function () {
	'use strict'
	
	function State (lastPlayedPosition, lastPlayedFilePath, lastPlayedPlaylist, lastPlayedMediaIndex, volume) {
		this.lastPlayedPosition = lastPlayedPosition;
		this.lastPlayedFilePath = lastPlayedFilePath;
		this.lastPlayedPlaylist = lastPlayedPlaylist;
		this.lastPlayedMediaIndex = lastPlayedMediaIndex;
		this.volume = volume;
	}

	return State;
})();

module.exports = State;