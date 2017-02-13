'use strict';

var exec = require('child_process').exec,
	fs = require('fs'),
	path = require('path'),
	from = require('fromjs'),
	FileExplorerService = require('./fileExplorerService'),
	Q = require('q'),
	FileInfo = require('../../models').FileInfo;

//var osDirectPath = "/mnt/";

var LinuxFileExplorerService = function () {
	FileExplorerService.call(this);

	this.canHandleOs = function (osName) {
		return osName === "linux";
	};

	this.normalizePathForCurrentOs = function (completePath) {
		return (completePath.startsWith("/"))
			? completePath
			: "/" + completePath;
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
		var cmd = "df -P | grep /dev/sd | awk  '{print $6}'";
		return getDrivesFromCmd(cmd)
			.then(function(rawDrivesOutput) {
				let driveArray = normalizeOutput(rawDrivesOutput);
				driveArray = prependHomeDir(driveArray);
				return castDrivesToFileInfoList(driveArray);
			});
	};

	function getDrivesFromCmd(cmd) {
		let defer = Q.defer();

		exec(cmd, function (err, stdOut, stdErr) {
			if (err) {
				defer.reject('Error running drive list command:' + err + "|" + stdErr);
				return;
			}
			defer.resolve(stdOut);
		});

		return defer.promise;
	}

	function normalizeOutput(rawDrivesOutput) {
		// TODO Turn to regex /^(.*)$/gm
		return from(rawDrivesOutput.split("\n"))
			.where(function(rawDrive) {
				return rawDrive !== "";
			})
			.toArray();
	}

	function prependHomeDir(driveArray) {
		return ["~/"].concat(driveArray);
	}

	function castDrivesToFileInfoList(drives) {
		return drives.map(function(drive) {
			let safeDriveName = drive;
			if (safeDriveName !== "/" && safeDriveName[safeDriveName.length-1] !== "/") {
				safeDriveName = drive + '/';
			}
			return new FileInfo(safeDriveName, safeDriveName, FileInfo.Directory, true);
		});
	}
};
LinuxFileExplorerService.prototype = Object.create(FileExplorerService.prototype);
LinuxFileExplorerService.prototype.constructor = FileExplorerService;

module.exports = LinuxFileExplorerService;
