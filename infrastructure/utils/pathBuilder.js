// TODO ask Fabien if it's a good idea to create a pathBuilder class like that
var PathBuilder = (function () {
	'use strict'

	function toAbsolutePath (playlistFilePath, mediaFileRelativePath) {
		return mediaFileRelativePath;
	}

	function toRelativePath (playlistFilePath, mediaFileFullPath) {
		return mediaFileFullPath;
	}

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

	return {
		toAbsolutePath: toAbsolutePath,
		toRelativePath: toRelativePath
	}

})();

module.exports = PathBuilder;