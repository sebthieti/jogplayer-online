'use strict';

jpoApp.factory("pathHelper", function () {

	var filePlayByPathPattern = "/api/media/play/path:mediaPath"; // TODO Handle start with '/' or not
	var mediaPlayByUrlPattern = "/api/media/play/:id:ext"; // TODO Handle start with '/' or not

	return {
		getFullMediaUrlPathFromMediaPath: function(mediaOrFile) {
			if (mediaOrFile._id) {
				return mediaPlayByUrlPattern.replace(':id', mediaOrFile._id).replace(':ext', mediaOrFile.ext);
			} else {
				return filePlayByPathPattern.replace(':mediaPath', mediaOrFile.filePath);
			}
		}
	}

});

