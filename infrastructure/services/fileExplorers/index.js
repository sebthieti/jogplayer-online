'use strict';

var os = require('os'),
	DarwinFileExplorerService = require("./darwinFileExplorerService"),
	LinuxFileExplorerService = require("./linuxFileExplorerService"),
	WinFileExplorerService = require("./winFileExplorerService");

module.exports.DarwinFileExplorerService = DarwinFileExplorerService;
module.exports.LinuxFileExplorerService = LinuxFileExplorerService;
module.exports.WinFileExplorerService = WinFileExplorerService;
module.exports.FileExplorerService = require("./fileExplorerService");

var fileExplorerServices = [
	new WinFileExplorerService(),
	new DarwinFileExplorerService(),
	new LinuxFileExplorerService()
];

function findAndBuildFileExplorerForCurrentOs(fileExplorerServices) {
	var currentOs = os.platform();
	var fileExplorerSvcForCurrentOs;
	for (var index = 0, fileExplorerSvcCnt = fileExplorerServices.length; index < fileExplorerSvcCnt; index++) {
		var fileExplorerSvc = fileExplorerServices[index];
		if (fileExplorerSvc.canHandleOs(currentOs)) {
			fileExplorerSvcForCurrentOs = fileExplorerSvc;
			break;
		}
	}
	return fileExplorerSvcForCurrentOs;
}

module.exports.buildFileExplorerService = function() {
	return findAndBuildFileExplorerForCurrentOs(fileExplorerServices);
};
