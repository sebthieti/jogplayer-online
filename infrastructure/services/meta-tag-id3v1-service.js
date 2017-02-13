var id3 = require('id3js');
var Q = require('q');

var MetaTagId3V1Service = (function () {
	'use strict'

	function MetaTagId3V1Service () {

		this.isOfTagVersionAsync = function (mediaFilePath) {
			return Q.promise(function (onSuccess, onError) {
				id3({ file: mediaFilePath, type: id3.OPEN_LOCAL }, function (err, tags) {
					if (!err) {
						onSuccess(tags);
					} else {
						onError(true);
					}
				})
			});
		}

		this.parseTagFromFileAsync = function (mediaFilePath) {
			return Q.promise(function (onSuccess, onError) {
				id3({ file: mediaFilePath, type: id3.OPEN_LOCAL }, function (err, tags) {
					if (!err) {
						onSuccess(tags);
					} else {
						onError(err);
					}
				})
			});
		}
	}

	return MetaTagId3V1Service;
})();

module.exports = MetaTagId3V1Service;