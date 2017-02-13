'use strict';

var id3 = require('id3js'),
	Q = require('q');

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

module.exports = MetaTagId3v1Service;