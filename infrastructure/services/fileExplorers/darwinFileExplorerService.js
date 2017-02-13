'use strict';

var osDirectPath = "/Volumes/";

function DarwinFileExplorerService () {
}

DarwinFileExplorerService.prototype.canHandleOs = function(osName) {
    return osName === "darwin";
};

DarwinFileExplorerService.prototype.normalizePathForCurrentOs = function (completePath) {
    return "/Volumes/" + completePath;
};

DarwinFileExplorerService.prototype.getAvailableDrivesPathsAsync = function() { // TODO must be turned to async
    return osDirectPath;
};

module.exports = DarwinFileExplorerService;