'use strict';

var fs = require('fs'),
	Q = require('q');

module.exports.mediaHelper = require('./mediaHelper');
module.exports.PathBuilder = require('./pathBuilder');
// TODO Send both to async helpers/utils ?
module.exports.checkFileExistsAsync = function(filePath) {
	var defer = Q.defer();
	fs.exists(filePath, function(exists) {
		defer.resolve(exists);
	});
	return defer.promise;
};
// TODO Should be part of Model instead of separate ?
module.exports.saveModelAsync = function(model) {
	var defer = Q.defer();
	model.save(function(err, savedModel) {
		if (!err) { defer.resolve(savedModel) }
		else { defer.reject(err) }
	});
	return defer.promise;
};