'use strict';

var Q = require('Q'),
	fs = require('fs');

var _fileExplorerDirector,
    _folderContentsCache = [],
    _fileWatchers = [];

function FileExplorerRepository (fileExplorerDirector) {
    _fileExplorerDirector = fileExplorerDirector;
}

FileExplorerRepository.prototype.getFolderContentAsync = function (urlPath) {
    var folderContent = tryFindFolderContentByUrlPath(urlPath);
    if (folderContent) {
        return Q.fcall(function () { return folderContent }, null);
    } else {
        return _fileExplorerDirector
            .getFolderContentAsync(urlPath)
            .then(function (folderContent) {
                //return cacheFolderContent (urlPath, folderContent);
	            return folderContent;
            });
    }
};

var cacheFolderContent = function (urlPath, folderContent) {
    // Real caching should have a duration
    _folderContentsCache[urlPath] = folderContent;
    watchFolderForChange(urlPath);
    return folderContent;
};

var watchFolderForChange = function (folderPath) { // TODO Should be service
	if (_fileWatchers[folderPath]) {
		return;
	}
	var _  = fs.watch(folderPath, function (event, filename) {
		console.log(event + '|' + filename);

		delete _folderContentsCache[folderPath];
		delete _fileWatchers[folderPath];
	});
	console.log('watching:' + folderPath);
};

var tryFindFolderContentByUrlPath = function(urlPath) {
    return _folderContentsCache[urlPath];
};

	//	    return tryFindFolderContentByUrlPath(urlPath)
//		    .onEmptyGetFolder(urlPath)
//
//
//
//		    , function() {
//		    _fileExplorerDirector
//                .getFolderContentAsync(urlPath)
////                .then(function (folderContent) {
////                    return cacheFolderContent (urlPath, folderContent);
////                })
//		        ;
//
//	    })

	//getData Factory method
	//invalidate That data On

//	var cacheFolderContent = function (urlPath, /*folderContent*/folderContentFactory) {
//		// Real caching should have a duration
//		_folderContentsCache[urlPath] = folderContentFactory()//.apply(this);
//		return folderContent;
//	};

module.exports = FileExplorerRepository;