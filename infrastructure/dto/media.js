//var dto = {};

/*dto.*/var MediaType = {
	AUDIO: 'Audio',
	VIDEO: 'Video'
};

/*dto.*/
var Media = (function () {
	'use strict'
	
	function Media(id, mediaType, index, title, filePath, duration, isAvailable, isSelected, bookmarks, metadatas) {
		//this.id = id;
		this._id = id;
		this.mediaType = mediaType;
		this.title = title;
		this.index = index;
		this.filePath = filePath;
		this.duration = duration;
		this.isAvailable = isAvailable;
		this.isSelected = isSelected;
		this.bookmarks = bookmarks;
		this.metadatas = metadatas;
	}
	// TODO Remember to use this in order to validate incoming requests
	Media.prototype.isValidDto = function (obj) {
		return obj &&
			obj.mediaType &&
			obj.title &&
			obj.filePath &&
			obj.duration &&
			obj.isAvailable &&
			obj.isSelected &&
			obj.bookmarks &&
			obj.metadatas;
	}

	return Media;

})();

module.exports.Media = Media;
module.exports.MediaType = MediaType;