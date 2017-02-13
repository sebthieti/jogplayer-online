'use strict';

require('../extentions').StringExtentions;
var Q = require('q'),
	Media = require('../models').Media,
	mediaHelper = require('../utils').mediaHelper;

var _mediaService,
    _mediaSaveService;

function MediaDirector (mediaService, mediaSaveService) {
	_mediaService = mediaService;
    _mediaSaveService = mediaSaveService;
}

MediaDirector.prototype.getBinaryChunkAndFileSizeByIdAsync = function (mediaId, fromOffset, toOffset) {
	return _mediaSaveService
		.getMediaByIdAsync(mediaId)
		.then(function(media) {
			return getOffsetAndFileSize(media.filePath, toOffset) // TODO Later use repositories to save fileSize (save file size)
				.then(function(offsetAndFileSize) {
					offsetAndFileSize.media = media;
					return offsetAndFileSize;
				});
		})
		.then(function (dataSet) {
			var safeToOffset = toOffset || dataSet.fileSize;
			return _mediaService
				.getFileChunkAsync(dataSet.media.filePath, fromOffset, safeToOffset)
				.then(function (data) {
					return { media: dataSet.media, data: data, fileSize: dataSet.fileSize }
				});
		});
};

MediaDirector.prototype.getBinaryChunkAndFileSizeByPathAsync = function (mediaPath, fromOffset, toOffset) {
	return Q
		.fcall(giveRealPath, mediaPath)
		.then(function(realPath) {
			return getOffsetAndFileSize(realPath, toOffset);
		})
		.then(function (dataSet) {
			var safeToOffset = toOffset || dataSet.fileSize;
			return _mediaService
				.getFileChunkAsync(mediaPath, fromOffset, safeToOffset)
				.then(function (data) {
					return { mimeType: mediaHelper.getMimeTypeFromPath(mediaPath), data: data, fileSize: dataSet.fileSize }
				});
		});
};

MediaDirector.prototype.ensureReadableMediaAsync = function (mediaFilePath, browserFormats) {
	// mediaFilePath > eventual path to converted media if needed
    if (canBrowserHandleFormat(mediaFilePath, browserFormats)) {
        return Q.fcall(function () { return mediaFilePath }, null);
    } else {
        // is this media already converted ? // TODO Record in db
        // proceed to convertion, then return path
        return _mediaService.convertMediaToAsync(mediaFilePath, /*browserFormats*/'.mp3');
    }
};

var canBrowserHandleFormat = function (mediaFilePath, browserAcceptedFormats) {
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
};

var getOffsetAndFileSize = function(mediaPath, toOffset) {
	return _mediaService
		.getFileSizeAsync(mediaPath)
		.then(function (fileSize) {
			return { offset: toOffset, fileSize: fileSize };
		})

};

var giveRealPath = function (mediaPath) {
	return mediaPath;
};

module.exports = MediaDirector;