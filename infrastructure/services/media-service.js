 var Q = require('q');
 var fs = require('fs');

var MediaService = (function () {
	'use strict';

	function MediaService(/*saveService, mediaBuilder*/) {

		this.checkAndUpdateMustRelocalize = function(medias) {
			Q.spread(medias, function (unknown) {
				var TODO = true;
			});


			//for (var mediaIndex = 0; mediaIndex < medias.length; mediaIndex++) {
				// return Q.nfcall(fs.exists, path)
				// 	.then(setMustRelocalize)
				// 	;
			//}
		};
	}

	return MediaService;
})();

module.exports = MediaService;