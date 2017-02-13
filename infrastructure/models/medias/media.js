var MediaSummary = require('./media-summary');
var MediaDto = require('../../dto/media');

var MediaType = {
	AUDIO: 'Audio',
	VIDEO: 'Video'
};

var Media = (function (_super) {
	'use strict'
	
	function Media(id, mediaType, title, filePath, duration, isAvailable, isSelected, bookmarks, metadatas) {
		_super.call(this, title, filePath, duration);

		this._id = id;
		this.mediaType = mediaType;
		this.isAvailable = isAvailable;
		this.isSelected = isSelected;
		this.bookmarks = bookmarks;
		this.metadatas = metadatas;
	}
	Media.prototype = Object.create(_super.prototype);
	Media.prototype.constructor = _super;

	Media.fromMediaSummary = function (mediaSummary, mediaType) {
		return new Media (
			null,
			mediaType,
			mediaSummary.title,
			mediaSummary.filePath,
			mediaSummary.duration,
			false, // TODO To change ?
			true, // TODO To change ?
			[],
			[]
		);
	};

	// TODO In the future, think about moving to extension class
//	Media.prototype.toDto = function (media) {
//		return new MediaDto.Media(
//			media.id,
//			media.mediaType,
//			media.title,
//			media.filePath,
//			media.duration,
//			media.mustRelocalize,
//			media.isSelected,
//			media.bookmarks,
//			media.metadatas
//		);
//	};

	return Media;

})(MediaSummary);

module.exports.Media = Media;
module.exports.MediaType = MediaType;