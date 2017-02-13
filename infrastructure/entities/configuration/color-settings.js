var Configuration = (function () {
	'use strict'
	
	function Configuration(normalColor, playColor, invalidColor, cutColor, normalFont, playFont, invalidFont, cutFont) {
		this.normalColor = normalColor;
		this.playColor = playColor;
		this.invalidColor = invalidColor;
		this.cutColor = cutColor;

		this.normalFont = normalFont;
		this.playFont = playFont;
		this.invalidFont = invalidFont;
		this.cutFont = cutFont;
	}

	return Configuration;
})();

module.exports = Configuration;