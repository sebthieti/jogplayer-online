'use strict';

var osDirectPath = "/mnt/";

function LinuxFileExplorerService () { // fileExplorerService s/b fileService
}

LinuxFileExplorerService.prototype.canHandleOs = function(osName) {
    return osName === "linux"; // TODO To test
};

LinuxFileExplorerService.prototype.normalizePathForCurrentOs = function (completePath) {
    return "/mnt/" + completePath;
};

LinuxFileExplorerService.prototype.getAvailableDrivesPathsAsync = function() {
    return osDirectPath;
};

module.exports = LinuxFileExplorerService;