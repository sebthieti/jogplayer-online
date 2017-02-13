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
	return false; // TODO Only for testing purpose
	let ext = mediaFilePath.substring(mediaFilePath.lastIndexOf('.'));
	// TODO Some browser may really put their types:
	// audio/webm,
	// audio/ogg,
	// audio/wav,
	// audio/*;q=0.9,
	// application/ogg;q=0.7,
	// video/*;q=0.6,
	// */*;q=0.5
	//browserAcceptedFormats.contains('*/*');
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
		//return true;
	} /*else if (browserAcceptedFormats) {
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
	}*/
	else if (browserAcceptedFormats !== '') {
		//let acceptedFormats = {
		//	'audio/webm': /audio\/webm/.exec(browserAcceptedFormats),
		//	'audio/ogg': /audio\/ogg/.exec(browserAcceptedFormats),
		//	'audio/wav': /audio\/wav/.exec(browserAcceptedFormats),
		//	'audio/mpeg': /audio\/mpeg/.exec(browserAcceptedFormats),
		//	'audio/*': /audio\/*/.exec(browserAcceptedFormats)
		//};
		let formatMapping = {
			'audio/aiff': ['.aif', '.aifc', '.aiff'],
			'audio/basic': ['.au', '.snd'],
			'audio/it': ['.it'],
			'audio/make': ['.funk', '.my', '.pfunk'],
			'audio/mid': ['.rmi'],
			'audio/midi': ['.kar', '.mid', '.midi'],
			'audio/mod': ['.mod'],
			'audio/mpeg': ['.m2a', '.mp2', '.mpa', '.mpg', '.mpga', 'mp3'],
			'audio/mpeg3': ['.mp3'],
			'audio/nspaudio': ['.la', '.lma'],
			'audio/s3m': ['.s3m'],
			'audio/tsp-audio': ['.tsi'],
			'audio/tsplayer': ['.tsp'],
			'audio/voc': ['.voc'],
			'audio/voxware': ['.vox'],
			'audio/wav': ['.wav'],
			'audio/x-adpcm': ['.snd'],
			'audio/x-aiff': ['.aif', '.aifc', '.aiff'],
			'audio/x-au': ['.au'],
			'audio/x-gsm': ['.gsd', '.gsm'],
			'audio/x-jam': ['.jam'],
			'audio/x-liveaudio': ['.lam'],
			'audio/x-mid': ['.mid', '.midi'],
			'audio/x-midi': ['.mid', '.midi'],
			'audio/x-mod': ['.mod'],
			'audio/x-mpeg': ['.mp2'],
			'audio/x-mpeg-3': ['.mp3'],
			'audio/x-nspaudio': ['.la', '.lma'],
			'audio/x-pn-realaudio': ['.ra', '.ram', '.rm', '.rmm', '.rmp'],
			'audio/x-realaudio': ['.ra'],
			'audio/x-twinvq': ['.vqf'],
			'audio/x-voc': ['.voc'],
			'audio/x-wav': ['.wav'],
			'audio/xm': ['.xm'],
			'audio/x-flac': ['.flac']
		};

		if (browserAcceptedFormats.indexOf('audio/*') !== -1) {
			return true;
		}

		let mimeTypes = [];
		for (let prop in formatMapping) {
			if (!formatMapping.hasOwnProperty(prop)) {
				continue;
			}
			if (formatMapping[prop].contains(ext)) {
				mimeTypes.push(prop);
			}
		}

		return !!_.find(mimeTypes, function (mimeType) {
			return browserAcceptedFormats.indexOf(mimeType) !== -1;
		});
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