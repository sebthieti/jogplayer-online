var id3 = require('id3js');
var Q = require('q');

var MetaTagId3v1Service = (function () {
	'use strict';

	function MetaTagId3v1Service () {
	}

	MetaTagId3v1Service.prototype.isOfTagVersionAsync = function (mediaFilePath) {
		return Q.promise(function (onSuccess, onError) {
			id3({ file: mediaFilePath, type: id3.OPEN_LOCAL }, function (err, tags) {
				if (!err) {
					onSuccess(tags);
				} else {
					onError(true);
				}
			})
		});
	};

	MetaTagId3v1Service.prototype.parseTagFromFileAsync = function (mediaFilePath) {
		return Q.promise(function (onSuccess, onError) {
			id3({ file: mediaFilePath, type: id3.OPEN_LOCAL }, function (err, tags) {
				if (!err) {
					onSuccess(tags);
				} else {
					onError(err);
				}
			})
		});
	};

	return MetaTagId3v1Service;
})();

module.exports = MetaTagId3v1Service;