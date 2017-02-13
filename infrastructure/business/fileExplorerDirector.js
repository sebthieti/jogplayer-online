'use strict';

require('../extentions').StringExtentions;

var Q = require('q'),
	from = require('fromjs'),
	path = require('path'),
	_ = require('underscore'),
	routes = require('../routes'),
	linkBuilder = require('../utils/linkBuilder');

var _fileExplorerService;

function FileExplorerDirector(fileExplorerService) {
	_fileExplorerService = fileExplorerService;
}

FileExplorerDirector.prototype.getFolderContentAsync = function (urlPath, issuer) {
	if (!acceptPath(urlPath, issuer.permissions)) {
		throw 'Unauthorized access'; // TODO Should become HTTP 403
	}
	return exploreFilePathAsync(urlPath, issuer);
};

function exploreFilePathAsync(urlPath, issuer) {
	var isRoot = urlPath === '/';
	return _fileExplorerService
		.readFolderContentAsync(urlPath)
		.then(function(files) {
			return filterAuthorizedPaths(files, isRoot, urlPath, issuer)
		})
		.then(function(files) {
			return filterFilesIfNotRoot(files, isRoot)
		})
		.then(function(files) {
			return linkBuilder.toFolderContentDto(urlPath, files);
		});
}

function filterAuthorizedPaths(fileInfos, isRoot, urlPath, issuer) {
	return from(fileInfos)
		.where(function (fileInfo) {
			//var path = urlPath + fileInfo.getName() + (fileInfo.isDirectory() ? '/' : '');
			return acceptPath(fileInfo.filePath, issuer.permissions); // fileInfo.isDirectory()
		})
		.toArray();
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

FileExplorerDirector.prototype.getFileInfoAsync = function (urlPath, issuer) {
	if (!acceptPath(urlPath, issuer.permissions)) {
		throw 'Unauthorized access'; // TODO Should become HTTP 403
	}

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

module.exports = FileExplorerDirector;