'use strict';

require('../extentions').StringExtentions;
var Q = require('q'),
	from = require('fromjs'),
	path = require('path'),
	linkBuilder = require('../utils/linkBuilder');

var _fileExplorerService;

function FileExplorerDirector(fileExplorerService) {
	_fileExplorerService = fileExplorerService;
}

FileExplorerDirector.prototype.getFolderContentAsync = function (urlPath) {
	return exploreFilePathAsync(urlPath);
};

function exploreFilePathAsync(urlPath) {
	var isRoot = urlPath === '/';
	return _fileExplorerService
		.readFolderContentAsync(urlPath)
		.then(function(files) {
			return filterFilesIfNotRoot(files, isRoot)
		})
		.then(function(files) {
			return linkBuilder.toFolderContentDto(urlPath, files);
		});
}

function filterFilesIfNotRoot(folderContent, isRoot) {
	return isRoot
		? folderContent
		: filterBySupportedMediaTypes(folderContent);
}

function filterBySupportedMediaTypes(fileInfos) {
	return from(fileInfos)
		.where(function (fileInfo) {
			if (fileInfo.isDirectory()) {
				return true;
			}
			var ext = fileInfo.getName().substring(fileInfo.getName().lastIndexOf('.'));
			return isSupportedMediaExt(ext);
		})
		.toArray();
}

function isSupportedMediaExt(ext) {
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
}

FileExplorerDirector.prototype.getFileInfoAsync = function (urlPath) {
	return getFileInfoPathAsync(urlPath);
};

function getFileInfoPathAsync(urlPath) {
	return _fileExplorerService
		.readFileInfoAsync(urlPath)
		.then(function(file) {
			var dirPath = path.dirname(urlPath) + '/';
			return linkBuilder.toFileInfoDto(dirPath, file);
		});
}

module.exports = FileExplorerDirector;