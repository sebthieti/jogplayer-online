'use strict';

var fs = require('fs'),
	from = require('fromjs'),
	path = require('path'),
	Q = require('q'),
	FileInfo = require('../../models').FileInfo;

var readFileInfoAsync = function(urlPath) {
	var realPath = mapUrlToServerPath.call(this, urlPath);
	var fileName = path.basename(realPath);
	return queryFileStatAsync(realPath, fileName);
};

var readFolderContentAsync = function (urlPath) {
	var isRoot = urlPath === '/';

	// If root, then show all drives. Procedure may depend on os
	if (isRoot) {
		return this.getAvailableDrivesPathsAsync();
	} else {
		var realPath = mapUrlToServerPath.call(this, urlPath);
		return performFolderReadDirAsync(realPath, urlPath);
	}
};

var performFolderReadDirAsync = function (basePath) {
	return Q
		.nfcall(fs.readdir, basePath)
		.then(function (fileNames) {
			return spreadFileStatsQueriesInDirAsync(basePath, fileNames);
		})
		.then(filterByValidFiles)
		.then(filterByOnlyVisibleFiles);
};

var filterByValidFiles = function (fileInfos) {
	return from(fileInfos)
		.where(function(fileInfo) {
			return fileInfo.isValid()
		})
		.toArray();
};

var filterByOnlyVisibleFiles = function (fileInfos) {
	return from(fileInfos)
		.where(function (fileInfo) {
			return fileInfo.getName()[0] !== '.' &&
				fileInfo.getName().toLowerCase() !== "$recycle.bin" &&
				fileInfo.getName().toLowerCase() !== "system volume information" &&
				fileInfo.getName().toLowerCase().substring(0, 6) !== "found.";
		})
		.toArray();
};

var mapUrlToServerPath = function (urlPath) {
	return this.normalizePathForCurrentOs(urlPath);
};

var spreadFileStatsQueriesInDirAsync = function (basePath, fileNames) {
	var fileStatPromises = fileNames.map(function(fileName) {
		var fullFilePath = basePath + fileName;
		return queryFileStatAsync(fullFilePath, fileName);
	});
	return Q.all(fileStatPromises);
};

var queryFileStatAsync = function (fullFilePath, fileName) {
	return Q
		.nfcall(fs.stat, fullFilePath)
		.then(function(fileStat) { // onSuccess
			if (!fileStat) {
				return FileInfo.invalid;
			}
			return new FileInfo(
				fileName,
				fileStat.isDirectory() ? FileInfo.directory : FileInfo.file,
				false
			);
		}, function(e) { // onError
			// errno:34 code:ENOENT when no drive
			// TODO What error for drive empty CD drive?
			return FileInfo.invalid;
		});
};

var FileExplorerService = function() {
};

FileExplorerService.prototype = {
	readFolderContentAsync: readFolderContentAsync,
	readFileInfoAsync: readFileInfoAsync
};

module.exports = FileExplorerService;