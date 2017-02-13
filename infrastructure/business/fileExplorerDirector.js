'use strict';

require('../extentions').StringExtentions;
var Q = require('q'),
    fs = require('fs'),
    from = require('fromjs');

var _fileExplorerService;

var exploreFilePathAsync = function (urlPath) {
    var isRoot = urlPath === '/';

	var filesAsync;
    // If root, then show all drives. Procedure may depend on os
	if (isRoot) {
		filesAsync = _fileExplorerService.getAvailableDrivesPathsAsync();
    } else {
	    var realPath = mapUrlToServerPath(urlPath);
		filesAsync = performFolderReadDirAsync(realPath, urlPath);
    }

	return filesAsync.then(function(files) {
		var parentLink = tryMakeParentLink(urlPath);
		var selfPhys = tryMakeSelfPhysLink(urlPath);

		var fileContent = {
			links: [ // TODO To builder
				makeSelfLink(urlPath)
			],
			files: addLinkToFiles(files, urlPath)
		};
		if (parentLink) {
			fileContent.links.push(parentLink);
		} if (selfPhys) {
			fileContent.links.push(selfPhys);
		}
		return fileContent;
	});
};

var mapUrlToServerPath = function (urlPath) {
    var completePath = urlPath;//decodeURI();
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
        case ".flac":
        case ".ogg":
	    case '.m3u':
	    case '.m3u8':
	    case '.pls':
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

var tryMakeUpPath = function(urlPath){
	var noTrailingSlash;
	if (urlPath.endsWith('/')) {
		noTrailingSlash = urlPath.substring(0, urlPath.length-1);
	} else {
		noTrailingSlash = urlPath;
	}
	var upPath = noTrailingSlash.substring(0, noTrailingSlash.lastIndexOf('/') + 1);
//	if (upPath && upPath !== '/') {
//		upPath += '/';
//	}
//	if (upPath === '/') {
//		upPath = '';
//	}
	return upPath;
};

var addLinkToFiles = function(files, parentFolderPath) {
	// encode url, no '/' if just file
	files.forEach(function(file) {
		// ^\/api\/explore\/(.*[\/])*$/
		var fullFilePath = parentFolderPath + file.name;//encodeURI();
		var pathTail = file.type === 'D' ? '/' : '';
		fullFilePath = fullFilePath + pathTail;
		file.links = [{
			rel: 'self',
			href: '/api/explore' + fullFilePath
		}];
		var selfPlayLink = tryMakeSelfPlayLink(file, parentFolderPath);
		if (selfPlayLink) {
			file.links.push(selfPlayLink);
		}
		 var selfPhysLink = tryMakeSelfPhysLink(fullFilePath);
		if (selfPhysLink) {
			file.links.push(selfPhysLink);
		}
	});
	return files;
};

var makeSelfLink = function (urlPath) {
	return {
		rel: 'self',
		href: '/api/explore' + urlPath//encodeURI()
	}
};

var tryMakeParentLink = function (urlPath) {
	var upPath = tryMakeUpPath(urlPath);
	if (!upPath) {
		return;
	}
	return {
		rel: 'parent',
		href: '/api/explore' + upPath//encodeURI()
	}
};

var tryMakeSelfPlayLink = function (file, parentFolderPath) {
	if (file.type && file.type === 'F') {
		var fullFilePath = parentFolderPath + file.name;//encodeURI();
		return {
			rel: 'self.play', // TODO only when playable
			href: '/api/media/play/path' + fullFilePath
		}
	}
};

var tryMakeSelfPhysLink = function (urlPath) {
	if (!urlPath || urlPath === '/') {
		return;
	}
	return {
		rel: 'self.phys',
		href: urlPath//encodeURI()
	}
};

function FileExplorerDirector (fileExplorerService) {
	_fileExplorerService = fileExplorerService;
}

FileExplorerDirector.prototype = {
	getFolderContentAsync: function (urlPath) {
		return exploreFilePathAsync(urlPath);
	}
};

module.exports = FileExplorerDirector;