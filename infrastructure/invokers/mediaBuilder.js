'use strict';

var Q = require('q'),
	//fs = require('fs'),
	//path = require('path'),
	//from = require('fromjs'),
	//MediaSummary = require('../models/medias/media-summary'),
	Media = require('../models').Media,
	mediaHelper = require('../utils').mediaHelper/*,
	MediaType = require('../models/').MediaType*/;

var _metaTagServices,
	_mediaService;

function MediaBuilder (metaTagServices, mediaService) {
	_metaTagServices = metaTagServices;
	_mediaService = mediaService;
}

MediaBuilder.prototype.buildMediaAsync = function (filePath, index) {
	if (!filePath) {
		throw "MediaBuilder.buildMedia: filePath not set";
	}

	var defer = Q.defer();

	_mediaService
		.getMediaInfosAsync(filePath)
		.then(function(mediaInfos) {
			var mimeType = mediaHelper.getMimeTypeFromPath(mediaInfos.filename);

			var medium = new Media({
				duration: Math.round(mediaInfos.format.duration),
				ext: mediaInfos.fileext,
				name: mediaInfos.filename,
				index: index,
				filePath: mediaInfos.file,
				checked: true,
				mimeType: mimeType,
				mustRelocalize: false,
				title: mediaInfos.filename,
				metadatas: [],
				bookmarks: []
			});
			defer.resolve(medium);
		});

	return defer.promise;

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
};

module.exports = MediaBuilder;

//	this.buildMediaSummary = function (filePath, title, duration) {
//		if (!filePath) {
//			throw "MediaBuilder.buildMediaSummary: filePath not set";
//		}
//		return new MediaSummary(
//			title,
//			filePath,
//			duration
//		);
//	}
//
//	this.toMedia = function (mediaSummary) {
//		if (!mediaSummary) {
//			throw "MediaBuilder.toMedia error: mediaSummary must be set";
//		}
//		return Media.fromMediaSummary(
//			mediaSummary,
//			determineMediaType(mediaSummary.filePath)
//		);
//	}
//
//	 function determineMediaType (filePath) {
//		 if (isAudioExtention(filePath)) {
//			 return MediaType.AUDIO;
//		 }
//		 throw "Unhandled media extention (video files not supported)";
//	 }
//
//	 function isAudioExtention(filePath) {
//		 if (!filePath) {
//			 return false;
//		 }
//		 var fileExt = path.extname(filePath).toLowerCase()
//		 switch (fileExt) {
//			 case ".cda":
//			 case ".flac":
//			 case ".ogg":
//			 case ".mp3":
//			 case ".wav":
//			 case ".wma":
//				 return true;
//			 default:
//				 return false;
//		 }
//	 }
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