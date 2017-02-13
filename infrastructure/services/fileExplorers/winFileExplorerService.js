'use strict';

var child_process = require('child_process'),
	Q = require('Q'),
	path = require('path'),
	FileExplorerService = require('./fileExplorerService'),
	FileInfo = require('../../models').FileInfo;

var anyDriveLetterPattern = /([a-zA-Z]:)/g;

var WinFileExplorerService = function() {
	FileExplorerService.call(this);

	this.canHandleOs = function (osName) {
		return osName === "win32";
	};

	this.normalizePathForCurrentOs = function (completePath) {
		if (completePath.startsWith('/')) {
			return completePath.substring(1).replace(/\//g, path.sep);
		}
		return completePath.replace(/\//g, path.sep);
	};

	this.getNewLineConstant = function () {
		return '\r\n';
	};

	this.getNetworkRoot = function () {
		return path.sep + path.sep;
	};

	this.getLevelUpPath = function () {
		return '..' + path.sep;
	};

	this.getAvailableDrivesPathsAsync = function () {
		return Q.promise(function (onSucceed, onError) {
			// For Windows we need a process to get for us drives paths
			var exec = child_process.exec;
			var cmd = 'wmic logicaldisk get name';
			exec(cmd, function (err, stdOut, stdErr) {
				if (err) {
					onError('Error running wmic logicaldisk command:' + err + "|" + stdErr);
					return;
				}

				onSucceed(stdOut
					.match(anyDriveLetterPattern)
					.map(function(drive) {
						return new FileInfo('/' + drive + '/', drive, FileInfo.Directory, true);
					})
				);
			});
		});
	};
};
WinFileExplorerService.prototype = Object.create(FileExplorerService.prototype);
WinFileExplorerService.prototype.constructor = FileExplorerService;

module.exports = WinFileExplorerService;