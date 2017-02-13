'use strict';

module.exports = {

	isValidDto: function (pl) {
		if (pl.index === undefined) {
			pl.index = null;
		}
		return pl !== undefined &&
			pl._id === undefined &&
			pl.name !== undefined &&
			pl.checked !== undefined &&
			pl.media !== undefined; // TODO Have to validate medias
	}

};