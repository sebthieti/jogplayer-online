'use strict';

var path = require('path'),
	FileExplorerService = require('./fileExplorerService');

var osDirectPath = "/mnt/";

var LinuxFileExplorerService = function () {
	FileExplorerService.call(this);

	this.canHandleOs = function (osName) {
		return osName === "linux";
	};

	this.normalizePathForCurrentOs = function (completePath) {
		return osDirectPath + completePath;
	};

	this.getNewLineConstant = function () {
		return '\n';
	};

	this.getNetworkRoot = function () {
		return path.sep + path.sep;
	};

	this.getLevelUpPath = function () {
		return '..' + path.sep;
	};

	this.getAvailableDrivesPathsAsync = function () {
		return osDirectPath;
	}
};
LinuxFileExplorerService.prototype = Object.create(FileExplorerService.prototype);
LinuxFileExplorerService.prototype.constructor = FileExplorerService;

module.exports = LinuxFileExplorerService;
