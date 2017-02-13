'use strict';

require('../../extentions').StringExtentions;
var child_process = require('child_process'),
	Q = require('Q');

function WinFileExplorerService () {
}

WinFileExplorerService.prototype.canHandleOs = function(osName) {
    return osName === "win32";
};

WinFileExplorerService.prototype.normalizePathForCurrentOs = function (completePath) {
    if (completePath.startsWith('/')) {
	    return completePath.substring(1).replace(/\//g, '\\');
    }
	return completePath.replace(/\//g, '\\');
};

WinFileExplorerService.prototype.getAvailableDrivesPathsAsync = function() {
    return Q.promise(function(onSucceed, onError) {
        // For Windows we need a process to get for us drives paths
        var exec = child_process.exec;
        var cmd = 'wmic logicaldisk get name';
        exec(cmd, function(err, stdOut, stdErr) {
	        if (err) {
		        onError('Error running wmic logicaldisk command:' + err + "|" + stdErr);
		        return;
	        }

	        var splitted = stdOut.split('\n');// TODO Use system's CRLF .split("\n")
	        var drives = [];
	        for(var line = 1; line < splitted.length; line++) {
		        var drive = /(\S*)/.exec(splitted[line]);//splitted[line];
		        if (drive[0]) {
			        drives.push ({ name: drive[0], type: 'D', isRoot: true }); // TODO Add that to the other
		        }
	        }

	        onSucceed(drives);
        });
    });

};

module.exports = WinFileExplorerService;