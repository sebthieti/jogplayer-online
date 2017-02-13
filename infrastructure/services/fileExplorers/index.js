var DarwinFileExplorerService = require("./darwinFileExplorerService"),
	LinuxFileExplorerService = require("./linuxFileExplorerService"),
	WinFileExplorerService = require("./winFileExplorerService");

 (function (exports) {
	"use strict";

	 exports.FILEEXPLORERS = {
		 DarwinFileExplorerService: DarwinFileExplorerService,
		 LinuxFileExplorerService: LinuxFileExplorerService,
		 WinFileExplorerService: WinFileExplorerService
	 }

}(module.exports));