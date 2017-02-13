'use strict';

var Q = require('q'),
	//fs = require('fs'),
	path = require('path'),
	//from = require('fromjs'),
	MediaSummary = require('../models').MediaSummary,
	mediaHelper = require('../utils').mediaHelper/*,
	MediaType = require('../models/').MediaType*/;

var _metaTagServices,
	_mediaService,
	Media;

var MediaBuilder = function (metaTagServices, mediaService, mediaModel) {
	_metaTagServices = metaTagServices;
	_mediaService = mediaService;
	Media = mediaModel;
};

MediaBuilder.prototype = {

	toMediaAsync: function(mediaSummaries, playlistId, issuer) {
		var mediaPromises = mediaSummaries.map(
			function(mediumSummary) { return this.toMediumAsync(mediumSummary, playlistId, issuer) },
			this
		);
		return Q.all(mediaPromises);
	},

	toMediumAsync: function (mediaSummary, playlistId, issuer) {
		if (!mediaSummary) {
			throw new Error('MediaBuilder.toMedia error: mediaSummary must be set');
		}
		return this.buildMediumAsync(playlistId, mediaSummary.filePath, mediaSummary.index, issuer);
	},

	buildMediumAsync: function (playlistId, filePath, index, issuer) {
		if (!filePath) {
			throw new Error('MediaBuilder.buildMedia: filePath not set');
		}

		var mimeType = mediaHelper.getMimeTypeFromPath(filePath);
		return _mediaService
			.getMediumInfosAsync(filePath)
			.then(function (mediumInfo) {
				var mediumFormat = mediumInfo.detailedInfo.format;
				return new Media({
					ownerId: issuer.id,
					_playlistId: playlistId,
					duration: Math.round(mediumFormat.duration),
					ext: mediumInfo.fileext,
					name: mediumInfo.name,
					index: index,
					filePath: mediumFormat.filename,
					checked: true,
					mimeType: mimeType,
					isAvailable: true,
					title: mediumInfo.name, // TODO Should also look for tag's title
					metadatas: [],
					bookmarks: []
				});
			}, function(err) { // Can happen when loading a playlist where media are not found
				var fileext = path.extname(filePath);
				var name = path.basename(filePath, fileext);
				return new Media({
					ownerId: issuer.id,
					_playlistId: playlistId,
					duration: 0,
					ext: fileext,
					name: name,
					index: index,
					filePath: filePath,
					checked: true,
					mimeType: mimeType,
					isAvailable: false,
					title: name
				});
			});
	},

	buildMediaSummary: function (filePath, title, index, duration) {
		if (!filePath) {
			throw new Error('MediaBuilder.buildMediaSummary: filePath not set');
		}
		return new MediaSummary(
			title,
			index,
			filePath,
			duration
		);
	}

};

module.exports = MediaBuilder;

// TODO Uncomment the following for tag reading (maybe ffmpeg can do that)
//var determineMediaType = function (filePath) {
//	if (isAudioExtention(filePath)) {
//		return MediaType.AUDIO;
//	}
//	throw "Unhandled media extention (video files not supported)";
//};
//
//var isAudioExtention = function (filePath) {
//	if (!filePath) {
//		return false;
//	}
//	var fileExt = path.extname(filePath).toLowerCase();
//	switch (fileExt) {
//		case ".cda":
//		case ".flac":
//		case ".ogg":
//		case ".mp3":
//		case ".wav":
//		case ".wma":
//			return true;
//		default:
//			return false;
//	}
//};

//var metadatas = loadTags(filePath);
//
//var title = null;
//if (metadatas) {
//	title = findTitleFromTag(metadatas);
//}
//if (title == null) {
//	title = getTitleFromFilePath(filePath);
//}
//
////id, mediaType, title, filePath, duration, mustRelocalize, isSelected, bookmarks, metadatas
//return new Media(
//	Guid.Empty,
//	DetermineMediaType(filePath),
//	title,
//	filePath,
//	null
//)
//.SetMetadatas(metadatas)


//
//	 function findTitleFromTag(metadatas) {
//		 return from(metadatas)
//			 .select(function (tag) { return tag.title })
//			 .firstOrDefault();
//	 }
//
//	 function getTitleFromFilePath (filePath) {
//		 var fileNameExt = path.basename(filePath);
//		 var fileNameExtStartIndex = fileNameExt.lastIndexOf('.');
//		 return fileNameExt.slice(0, fileNameExtStartIndex);
//	 }
//
//	 function loadTags (filePath) {
//		 if (!fs.existsSync(filePath)) {
//			 return null;
//		 }
//		 return from(metaTagServices)
//			 .where(function (svc) {
//				 return svc
//					 .isOfTagVersionAsync(filePath)
//					 .then(function (isOfTagVersion) { return isOfTagVersion })
//					 .done();
//			 })
//			 .select(function (svc) {
//				 return svc
//					 .parseTagFromFileAsync(filePath)
//					 .then(function (tag) { return tag })
//					 .done();
//			 })
//			 .toArray();
//	 }