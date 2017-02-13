var PlaylistValidation = (function () {
	'use strict';

	function isValidDto (pl) {
		if (pl.index === undefined) {
			pl.index = null;
		}

		return pl !== undefined &&
			pl._id === undefined &&
			pl.plName !== undefined &&
			pl.isSelected !== undefined &&
			pl.medias !== undefined; // TODO Have to validate medias
	}

	return {
		isValidDto: isValidDto
	};

})();

module.exports = PlaylistValidation;