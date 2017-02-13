'use strict';

require('../extentions').StringExtentions;
var Q = require('q'),
	_ = require('underscore'),
	Media = require('../models').Media,
	mediaHelper = require('../utils').mediaHelper;

var _mediaService,
	_mediaSaveService;

function MediaDirector (mediaService, mediaSaveService) {
	_mediaService = mediaService;
	_mediaSaveService = mediaSaveService;
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

MediaDirector.prototype.ensureReadableMediaAsync = function (mediaFilePath, browserFormats, issuer) {
	if (!acceptPath(mediaFilePath, issuer.permissions)) {
		throw 'Unauthorized access';
	}

	// mediaFilePath > eventual path to converted media if needed
	if (canBrowserHandleFormat(mediaFilePath, browserFormats)) {
		return Q.fcall(function () { return mediaFilePath }, null);
	} else {
		// is this media already converted ? // TODO Record in db
		// proceed to convertion, then return path
		return _mediaService.convertMediumToAsync(mediaFilePath, /*browserFormats*/'.mp3');
	}
};

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

function canBrowserHandleFormat(mediaFilePath, browserAcceptedFormats) {
	var ext = mediaFilePath.substring(mediaFilePath.lastIndexOf('.'));
	if (browserAcceptedFormats === '*/*') {
		switch (ext) {
			case '.mp3':
				return true;
				break;
			case '.ogg':
				return true;
				break;
			default:
				return false;
		}
		return true;
	} else if (browserAcceptedFormats) {
		switch (ext) {
			case '.mp3':
				return browserAcceptedFormats.endsWith('mpeg');
				//mimeType = 'audio/mpeg';
				break;
			case '.ogg':
				return browserAcceptedFormats.endsWith('ogg');
				//mimeType = 'audio/ogg';
				break;
			default:
				return false;
		}
	} else {
		return true; // TODO Hack because tablet doesn't send browserAcceptedFormats. Use canPlayType
	}
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