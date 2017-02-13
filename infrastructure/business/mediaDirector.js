'use strict';

require('../extentions').StringExtentions;
let fs = require('fs'),
	path = require('path'),
	Q = require('q'),
	_ = require('underscore');

let utils = require('../utils'),
	Media = require('../models').Media,
	mediaHelper = require('../utils').mediaHelper;

var _mediaService,
	_mediaSaveService,
	_fileExplorerService;

function MediaDirector (mediaService, mediaSaveService, fileExplorerService) {
	_mediaService = mediaService;
	_mediaSaveService = mediaSaveService;
	_fileExplorerService = fileExplorerService;
}

MediaDirector.prototype.getMediumByIdAndPlaylistIdAsync = function (playlistId, mediumId, issuer) {
	return _mediaSaveService.getMediumByIdAndPlaylistIdAsync(playlistId, mediumId, issuer);
};

MediaDirector.prototype.getBinaryChunkAndFileSizeByIdAsync = function (mediumId, fromOffset, toOffset, issuer) {
	return _mediaSaveService
		.getMediaByIdAsync(mediumId, issuer)
		.then(function(medium) {
			if (!acceptPath(medium.filePath, issuer.permissions)) {
				throw 'Unauthorized access';
			}
			return medium;
		})
		.then(function(medium) {
			return getOffsetAndFileSizeAsync(medium.filePath, toOffset) // TODO Later use repositories to save fileSize (save file size)
				.then(function(offsetAndFileSize) {
					offsetAndFileSize.media = medium;
					return offsetAndFileSize;
				});
		})
		.then(function (dataSet) {
			var safeToOffset = toOffset || dataSet.fileSize;
			return {
				mimeType: dataSet.media.mimeType,
				dataStream: _mediaService.getFileStream(dataSet.media.filePath, fromOffset, safeToOffset),
				fileSize: dataSet.fileSize
			};
		});
};

MediaDirector.prototype.getBinaryChunkAndFileSizeByPathAsync = function (mediaPath, fromOffset, toOffset) {
	return Q
		.fcall(giveRealPath, mediaPath)
		.then(function(realPath) {
			return getOffsetAndFileSizeAsync(realPath, toOffset);
		})
		.then(function (dataSet) {
			var safeToOffset = toOffset || dataSet.fileSize;
			return {
				mimeType: mediaHelper.getMimeTypeFromPath(mediaPath),
				dataStream: _mediaService.getFileStream(mediaPath, fromOffset, safeToOffset),
				fileSize: dataSet.fileSize
			};
		});
};

MediaDirector.prototype.renameMe = function(mediaFilePath, browserFormats, issuer) {
	if (!acceptPath(mediaFilePath, issuer.permissions)) {
		throw 'Unauthorized access';
	}

	return utils.checkFileExistsAsync(mediaFilePath)
		.then(function(exists) {
			if (exists) {
				return {
					exists: exists,
					mediaFilePath: mediaFilePath
				};
			}
			return findClosestMatchAsync(mediaFilePath)
				.then(function (closestMediumFile) {
					return {
						exists: exists,
						mediaFilePath: closestMediumFile
					}
				});
		})
		.then(function(matchSet) {
			if (!matchSet.exists && matchSet.mediaFilePath === "") {
				throw "No file matches";
			}
			if (matchSet.exists) {
				return matchSet.mediaFilePath;
			}
			// Do convert, then return path
			return _mediaService.convertMediumToAsync(
				matchSet.mediaFilePath,
				path.extname(mediaFilePath)
			);
		});
};

function findClosestMatchAsync(mediaFilePath) {
	let mediumFileName = path.basename(mediaFilePath).substring(0, path.basename(mediaFilePath).lastIndexOf("."));
	let dirPath = path.dirname(mediaFilePath) + path.sep;
	return _fileExplorerService
		.readFolderContentAsync(dirPath)
		.then(function(files) {
			let similarFiles = files.filter(function(file) {
				let filename = path.basename(file.name).substring(0, path.basename(mediaFilePath).lastIndexOf("."));
				return filename === mediumFileName;
			});

			// May be null if original file has been removed
			// TODO Maybe use ffprobe to get the biggest one's rate if more than 1
			return similarFiles.length > 0
				? similarFiles[0].filePath
				: "";
		});
}

function acceptPath(urlPath, permissions) {
	if (permissions.isRoot || permissions.isAdmin) {
		return true;
	}

	var isPathDenied = _.any(permissions.denyPaths, function(denyPath) {
		return urlPath.startsWith(denyPath);
	});
	return !isPathDenied;

	//var hasAcceptedPath = _.any(permissions.allowPaths, function(allowPath) {
	//	return urlPath.startsWith(allowPath);
	//});
	//
	//return hasAcceptedPath;
}

function getOffsetAndFileSizeAsync(mediaPath, toOffset) {
	return _mediaService
		.getFileSizeAsync(mediaPath)
		.then(function (fileSize) {
			return { offset: toOffset, fileSize: fileSize };
		});
}

function giveRealPath(mediaPath) {
	return mediaPath;
}

module.exports = MediaDirector;