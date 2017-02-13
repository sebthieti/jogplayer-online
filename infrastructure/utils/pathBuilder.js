'use strict';

function isRelativePathWithDots (relativeFilePath) {

}

function getDirectoryUpPath (fullFilePath, levelsUp) {

}

function isNetworkPath (filePath) {

}

function isSameRootPath (fullPath1, fullPath2) {

}

function isFile1InDeeperLevelThanFile2 (file1FullPath, file2FullPath) {

}

function inSameLevelOrSubLevel (baseFileFullPath, seekFileFullPath) {

}

function inSameDirectory (file1FullPath, file2FullPath) {

}

function getIndexFileTreeChange (file1FullPath, file2FullPath) {

}

function getRelativePathToSameLevelOrSubLevelFile (baseFileFullPath, file2FullPath) {

}

function getFullPathToFileWithoutRootPath (fileFullPath) {

}

module.exports = {
	toAbsolutePath: function (playlistFilePath, mediaFileRelativePath) {
		return mediaFileRelativePath;
	},
	toRelativePath: function (playlistFilePath, mediaFileFullPath) {
		return mediaFileFullPath;
	}
};