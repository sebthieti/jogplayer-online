'use strict';

require('../extentions').StringExtentions;
var path = require('path');

var isRelativePathWithDots = function (relativeFilePath) {
	return relativeFilePath.startsWith('..\\'); // TODO check for slash
};

var getDirectoryUpPath = function (fullFilePath, levelsUp) {
	var dir = path.dirname(fullFilePath);

	while (levelsUp > 0 && dir != null) {
		dir = path.resolve(dir, '..');
		levelsUp--;
	}

	return dir;
};

var isNetworkPath = function (filePath) {
	return filePath.startsWith('\\\\'); // TODO Check for schema file:///
};

var isSameRootPath = function (fullPath1, fullPath2) {

};

var isFile1InDeeperLevelThanFile2 = function (file1FullPath, file2FullPath) {

};

var inSameLevelOrSubLevel = function (baseFileFullPath, seekFileFullPath) {

};

var inSameDirectory = function (file1FullPath, file2FullPath) {

};

var getIndexFileTreeChange = function (file1FullPath, file2FullPath) {

};

var getRelativePathToSameLevelOrSubLevelFile = function (baseFileFullPath, file2FullPath) {

};

var getFullPathToFileWithoutRootPath = function (fileFullPath) {

};

module.exports = {

	toAbsolutePath: function (playlistFilePath, mediaFileRelativePath) {
		if (!playlistFilePath) {
			throw "playlistFilePath";
		} if (!mediaFileRelativePath) {
			throw "mediaFileRelativePath";
		}

		var resultPath;

		if (isRelativePathWithDots(mediaFileRelativePath)) {
			var levelUpPattern = '..\\';
			var levelsUp = mediaFileRelativePath.count(levelUpPattern);

			var mediaFileRelativePathWithoutDots = mediaFileRelativePath.substring(levelsUp * levelUpPattern.length);

			var newPlaylistBaseDirPath = getDirectoryUpPath(playlistFilePath, levelsUp);
			resultPath = path.resolve(newPlaylistBaseDirPath, mediaFileRelativePathWithoutDots);//Path.Combine(newPlaylistBaseDirPath, mediaFileRelativePathWithoutDots);
		} else if (isNetworkPath(mediaFileRelativePath)) {
			resultPath = mediaFileRelativePath;
		} else {
			// Start from drive letter (TODO Test if can work other than windows)
			var drive = playlistFilePath.split(path.sep)[0];

			resultPath = path.resolve(drive, mediaFileRelativePath); //Path.Combine(plFileInfo.DirectoryName, mediaFileRelativePath);
			if (!resultPath.toLowerCase().startsWith(playlistFilePath.substring(0, 2).toLowerCase())) {
				resultPath = playlistFilePath.substring(0, 2) + resultPath;
			}
		}

		return resultPath;
	},

	toRelativePath: function (playlistFilePath, mediaFileFullPath) {
		return path.relative(playlistFilePath, mediaFileFullPath);
	}

};