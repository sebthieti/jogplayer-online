'use strict';

module.exports = {

	isValidDto: function (pl) {
		if (pl.index === undefined) {
			pl.index = null;
		}

		var isValidVirtual =
			pl !== undefined &&
			pl._id === undefined &&
			pl.name !== undefined &&
			pl.media !== undefined; // TODO Have to validate medias

		var isValidPhys =
			pl !== undefined &&
			pl._id === undefined &&
			pl.filePath !== undefined &&
			pl.media === undefined;

		return isValidPhys || isValidVirtual;
	}

};