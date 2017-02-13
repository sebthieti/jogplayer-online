'use strict';

var Q = require('q'),
	fs = require('fs'),
	path = require('path'),
	ffmpeg = require('fluent-ffmpeg'),
	ffprobe = ffmpeg.ffprobe,
	utils = require('../utils');

var Models = require('../models'),
	MediumInfo = Models.MediumInfo;

var _convertionOutputFolderRelativePath = "./_converted/",
	overwriteOutput = '-y';

var getMediumInfosAsync = function (mediaFilePath) {
	return Q
		.fcall(getBasicMediumInfo, mediaFilePath)
		.then(function (basicInfo) {
			return Q
				.nfcall(ffprobe, mediaFilePath)
				.then(function(detailedMediumInfo) {
					return new MediumInfo(basicInfo.name, basicInfo.fileext, detailedMediumInfo);
				});
		});
};

var getBasicMediumInfo = function (filePath) {
	var fileext = path.extname(filePath);
	var name = path.basename(filePath, fileext);
	return { name: name, fileext: fileext };
};

var convertMediumToAsync = function (mediaFilePath, outputFormat) {
	var outputFilePath = generateConvertedMediaFilePath(mediaFilePath, outputFormat);

	return utils
		.checkFileExistsAsync(outputFilePath)
		.then(function(fileAlreadyConverted) {
			if (fileAlreadyConverted) {
				return outputFilePath;
			}
			return ensureConvertionOutputFolderExistsAsync()
				.then(function (){
					return execMediumConvertionAsync (
						mediaFilePath,
						outputFormat,
						outputFilePath
					);
				});
		});
};

var ensureConvertionOutputFolderExistsAsync = function () {
	return utils.checkFileExistsAsync(getConvertionOutputFolderPath())
		.then(ifNotExistsCreateConvertionOutputFolderAsync);
};

var getConvertionOutputFolderPath = function () {
	return path.join(process.cwd(), _convertionOutputFolderRelativePath); // or resolve ?
};

var ifNotExistsCreateConvertionOutputFolderAsync = function (folderExists) {
	if (!folderExists) {
		return Q.nfcall(fs.mkdir, getConvertionOutputFolderPath())
	}
};

var execMediumConvertionAsync = function (mediaFilePath, outputFormat, outputFilePath) {
	// TODO try -map option (http://www.ffmpeg.org/ffmpeg.html)
	// TODO try -codec copy (http://www.ffmpeg.org/ffmpeg-all.html)
	// TODO try -t duration (output), -to position (output) (Xclusive Or), check interesting other next options
	var deferred = Q.defer();
	ffmpeg()
		.input(mediaFilePath)
		.output(outputFilePath)
		.outputOptions(overwriteOutput)
		.on('end', function() {
			deferred.resolve(outputFilePath);
		})
		.on('error', function (err) {
			deferred.reject(err);
		})
		.run(); // TODO Maybe add somewhere the fact that medium has been converted, to avoid to do it again

	return deferred.promise;
};

var generateConvertedMediaFilePath = function (mediaFilePath, outputFormat) {
	var ext = path.extname(mediaFilePath);

	var convertionFolderPath = getConvertionOutputFolderPath();
	var mediaFileNameNoExt = path.basename(mediaFilePath, ext);

	return path.join(convertionFolderPath, mediaFileNameNoExt + outputFormat);
};

//var checkAndUpdateMustRelocalizeAsync = function(media) {
//	var checkAndUpdatePromises = media.map(function(medium) {
//		return utils.checkFileExistsAsync(medium.filePath)
//			.then(function (fileExists) { return setMustRelocalize(medium, fileExists) });
//	});
//	return Q.all(checkAndUpdatePromises);
//};
//
//var setMustRelocalize = function(medium, fileExists) {
//	return medium.setMustRelocalize(!fileExists);
//};

var getFileSizeAsync = function(filePath) {
	return Q
		.nfcall(fs.stat, filePath)
		.then(function(stat) {
			return stat.size;
		}, function(err) { // TODO File might not exists at that time
			console.log(err);
		});
};

var getFileStream = function(filePath, fromOffset, toOffset) {
	return fs.createReadStream(filePath, { start: fromOffset, end: toOffset });
};

module.exports = {
	getMediumInfosAsync: getMediumInfosAsync,
	convertMediumToAsync: convertMediumToAsync,
	//checkAndUpdateMustRelocalizeAsync: checkAndUpdateMustRelocalizeAsync,
	getFileSizeAsync: getFileSizeAsync,
	getFileStream: getFileStream
};