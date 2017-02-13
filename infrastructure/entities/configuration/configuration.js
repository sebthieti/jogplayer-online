var Configuration = (function () {
	'use strict'
	
	function Configuration(undoRedoStackSize, colorSettings) {
		this.undoRedoStackSize = undoRedoStackSize;
		this.colorSettings = colorSettings;
	}

	return Configuration;
})();

module.exports = Configuration;