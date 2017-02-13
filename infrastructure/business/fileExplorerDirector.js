'use strict';

var Q = require('q'),
    fs = require('fs'),
    from = require('fromjs');

var _fileExplorerService;

function FileExplorerDirector (fileExplorerService) {
    _fileExplorerService = fileExplorerService;
}

FileExplorerDirector.prototype.getFolderContentAsync = function (urlPath) {
    return exploreFilePathAsync(urlPath);
};

var exploreFilePathAsync = function (urlPath) {
    var isRoot = urlPath === '';
    // If root, then show all drives. Procedure may depend on os
    if (isRoot) {
	    return _fileExplorerService.getAvailableDrivesPathsAsync();
    } else {
	    var realPath = mapUrlToServerPath(urlPath);
	    return performFolderReadDirAsync(realPath);
    }
};

var mapUrlToServerPath = function (urlPath) {
    var completePath = decodeURI(urlPath);
    var realPath = _fileExplorerService.normalizePathForCurrentOs(completePath);
    return realPath;
};

var performFolderReadDirAsync = function (basePath) {
    return Q.nfcall(fs.readdir, basePath) // TODO reading s/b service stuff ? P/B, a weird error throws when trying to read empty CD drive
        .then(function (fileNames) {
            return spreadFileStatsQueriesInDirAsync(basePath, fileNames);
        })
        .then(filterByAccessibleFiles)
        .then(filterBySupportedMediaTypes)
        .then(filterByOnlyVisibleFiles)
        .then(mergeFileStatsAsyncResults);
};

var spreadFileStatsQueriesInDirAsync = function (basePath, fileNames) {
    var insertMediasPromises = [];
    var mediaCount = fileNames.length;
    for (var mediaIndex = 0; mediaIndex < mediaCount; mediaIndex++) {
        var fileName = fileNames[mediaIndex];
        var fullFileName = basePath + fileName;

        insertMediasPromises[mediaIndex] = queryFileStatAsync(fullFileName, fileName);
    }
    return Q.all(insertMediasPromises);
};

var queryFileStatAsync = function (fullFileName, fileName) {
    return Q.promise(function (onSuccess, onError) {
        fs.stat(fullFileName, function(err, stat) {
            if (!err) {
                onSuccess({stat: stat, name: fileName})
            } else {
                onSuccess({stat: null, name: fileName})
            }
        })
    });
};

var filterByAccessibleFiles = function (fileStats) {
    return from(fileStats)
        .where(function(fileStat) {
            return fileStat.stat != null
        })
        .toArray();
};

var filterBySupportedMediaTypes = function (fileStats) {
    return from(fileStats)
        .where(function (fileStat) {
            if (fileStat.stat.isDirectory()) {
                return true;
            }
            var ext = fileStat.name.substring(fileStat.name.lastIndexOf('.'));
            return isSupportedMediaExt(ext);
        })
        .toArray();
};

var isSupportedMediaExt = function (ext) {
    switch(ext) {
        case ".mp3":
            return true;
        case ".flac":
            return true;
        case ".ogg":
            return true;
        default:
            return false;
    }
};

var filterByOnlyVisibleFiles = function (fileStats) {
    return from(fileStats)
        .where(function (fileStat) {
            return fileStat.name[0] !== '.' &&
                fileStat.name !== "$RECYCLE.BIN" &&
                fileStat.name !== "System Volume Information" &&
                fileStat.name.substring(0, 6) !== "FOUND.";
        })
        .toArray();
};

var mergeFileStatsAsyncResults = function (fileStats) {
    return from(fileStats)
        .where(function(fileStat) {
            return fileStat.stat != null
        })
        .select(function(fileStat) {
            return {
                name: fileStat.name,
                type: fileStat.stat.isDirectory() ? 'D' : 'F'
            };
        })
        .toArray();
};

module.exports = FileExplorerDirector;