var Bookmark = (function () {
	'use strict'
	
	function Bookmark(id, name, comment, position) {
		this._id = id;
		this.name = name;
		this.comment = comment;
		this.position = position;
	}

	return Bookmark;
})();

module.exports = Bookmark;