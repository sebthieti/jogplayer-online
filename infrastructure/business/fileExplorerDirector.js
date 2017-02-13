'use strict';

require('../extentions').StringExtentions;
var Q = require('q'),
	from = require('fromjs'),
	linkBuilder = require('../utils/linkBuilder');

var _fileExplorerService;

var exploreFilePathAsync = function (urlPath) {
	var isRoot = urlPath === '/';
	return _fileExplorerService
		.readFolderContentAsync(urlPath)
		.then(function(files) {
			return filterFilesIfNotRoot(files, isRoot)
		})
		.then(function(files) {
			return linkBuilder.toFolderContentDto(urlPath, files);
		});
};

var filterFilesIfNotRoot = function(folderContent, isRoot) {
	return isRoot
		? folderContent
		: filterBySupportedMediaTypes(folderContent);
};

var filterBySupportedMediaTypes = function (fileInfos) {
	return from(fileInfos)
		.where(function (fileInfo) {
			if (fileInfo.isDirectory()) {
				return true;
			}
			var ext = fileInfo.getName().substring(fileInfo.getName().lastIndexOf('.'));
			return isSupportedMediaExt(ext);
		})
		.toArray();
};

var isSupportedMediaExt = function (ext) {
	switch(ext) {
		case ".mp3":
		case ".flac":
		case ".ogg":
		case '.m3u':
		case '.m3u8':
		case '.pls':
			return true;
		default:
			return false;
	}
};

var FileExplorerDirector = function (fileExplorerService) {
	_fileExplorerService = fileExplorerService;
}

FileExplorerDirector.prototype = {

	getFolderContentAsync: function (urlPath) {
		return exploreFilePathAsync(urlPath);
	}

};

module.exports = FileExplorerDirector;