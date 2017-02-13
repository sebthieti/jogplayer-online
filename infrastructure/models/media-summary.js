var MediaSummary = (function () {
	'use strict';
	
	function MediaSummary(title, index, filePath, duration) {
		this.title = title;
		this.index = index;
		this.filePath = filePath;
		this.duration = duration;
	}

//	MediaSummary.prototype.validate = function (obj) {
//		return obj &&
//			obj.title &&
//			obj.filePath &&
//			obj.duration;
//	}

	return MediaSummary;
})();

module.exports = MediaSummary;