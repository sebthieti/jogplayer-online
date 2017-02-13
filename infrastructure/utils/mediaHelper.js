'use strict';

module.exports = {
	getMimeTypeFromPath: function(mediaPath) {
		var mimeType = 'audio/*';
		var ext = mediaPath.substring(mediaPath.lastIndexOf('.'));
		switch (ext) {
			case '.mp3':
				mimeType = 'audio/mpeg';
				break;
			case '.ogg':
				mimeType = 'audio/ogg';
				break;
		}
		return mimeType;
	}
};