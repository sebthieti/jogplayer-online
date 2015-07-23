'use strict';

var path = require('path'),
	FileExplorerService = require('./fileExplorerService');

var osDirectPath = "/Volumes/";

var DarwinFileExplorerService = function () {
	FileExplorerService.call(this);

	this.canHandleOs = function (osName) {
		return osName === "darwin";
	};

	this.normalizePathForCurrentOs = function (completePath) {
		return "/Volumes/" + completePath;
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
	};
};
DarwinFileExplorerService.prototype = Object.create(FileExplorerService.prototype);
DarwinFileExplorerService.prototype.constructor = FileExplorerService;

module.exports = DarwinFileExplorerService;
