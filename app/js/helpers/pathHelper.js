'use strict';

jpoApp.factory("pathHelper", function () {

	var mediaPlayByPathPattern = "/api/medias/playByFilePath:mediaPath"; // TODO Handle start with '/' or not
	//var mediaPlayByPathPattern = "/api/medias/play/byPath:mediaPath"; // TODO Handle start with '/' or not

	return {
		getFullMediaUrlPathFromMediaPath: function(mediaPath) {
			return mediaPlayByPathPattern.replace(':mediaPath', mediaPath);
		}
	}

});

