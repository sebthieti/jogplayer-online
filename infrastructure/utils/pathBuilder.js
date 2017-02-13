'use strict';

var path = require('path');

var _fileExplorer;

var isRelativePathWithDots = function (relativeFilePath) {
	return relativeFilePath.startsWith('..' + path.sep);
};

var getDirectoryUpPath = function (fullFilePath, levelsUp) {
	var dir = path.dirname(fullFilePath);

	while (levelsUp > 0 && dir != null) {
		dir = path.resolve(dir, '..');
		levelsUp--;
	}

	return dir;
};

var isUNCPath = function (filePath) {
	return filePath.startsWith(_fileExplorer.getNetworkRoot());
};

var isAbsolutePath = function (mediaFileRelativePath) {
	return path.resolve(mediaFileRelativePath) === mediaFileRelativePath;
};

var PathBuilder = function(fileExplorer) {
	_fileExplorer = fileExplorer;
};

PathBuilder.prototype = {

	toAbsolutePath: function (playlistFilePath, mediaFileRelativePath) {
		if (!playlistFilePath) {
			throw "playlistFilePath";
		} if (!mediaFileRelativePath) {
			throw "mediaFileRelativePath";
		}

		var resultPath;

		if (isRelativePathWithDots(mediaFileRelativePath)) {
			var levelUpPattern = _fileExplorer.getLevelUpPath();
			var levelsUp = mediaFileRelativePath.count(levelUpPattern);

			var mediaFileRelativePathWithoutDots = mediaFileRelativePath.substring(levelsUp * levelUpPattern.length);

			var newPlaylistBaseDirPath = getDirectoryUpPath(playlistFilePath, levelsUp);
			resultPath = path.resolve(newPlaylistBaseDirPath, mediaFileRelativePathWithoutDots);
		} else if (isUNCPath(mediaFileRelativePath) || isAbsolutePath(mediaFileRelativePath)) {
			resultPath = mediaFileRelativePath;
		} else {
			// Start from drive letter (TODO Test if can work other than windows)
			var drive = playlistFilePath.split(path.sep)[0];

			resultPath = path.resolve(drive, mediaFileRelativePath);
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

module.exports = PathBuilder;