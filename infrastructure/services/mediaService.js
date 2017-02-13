'use strict';

var Q = require('q'),
	fs = require('fs'),
	path = require('path'),
    child_process = require('child_process'),
	probe = require('node-ffprobe');

var _convertionOutputFolderRelativePath = "./_converted/",
	_ffmpeg_process = null;

function MediaService() {

}

MediaService.prototype.checkAndUpdateMustRelocalize = function(medias) {
	//Q.spread(medias, function (unknown) {
	//	var TODO = true;
	//});

	return medias;

	//for (var mediaIndex = 0; mediaIndex < medias.length; mediaIndex++) {
	// return Q.nfcall(fs.exists, path)
	// 	.then(setMustRelocalize)
	// 	;
	//}
};

MediaService.prototype.getFileSizeAsync = function(filePath) {
	return Q.promise(function (onSuccess, onError) {
		fs.stat(filePath, function (err, stats) {
			if (!err) {
				onSuccess(stats.size);
			} else {
				onError(err);
			}
		});
	});
};

MediaService.prototype.getFileChunkAsync = function(filePath, fromOffset, toOffset) {
	return Q.promise(function(onSuccess, onError) {
		fs.open(filePath, 'r', function(status, fd) { // TODO Beautifull pyramid of doom!
			if (status) {
				console.log(status.message);
				return;
			}

//				fs.readFile(filePath, "binary", function(err, file) {
//					onSuccess(file.slice(fromOffset, toOffset)/*+'0'*/);
//					//response.write(file.slice(start, end)+'0', "binary");
//				});

            var bufferSize = (toOffset - fromOffset) + 1;

            //console.log('bufferSize:' + bufferSize + '!fromOffset:' + fromOffset + '!toOffset:' + toOffset);

			var buffer = new Buffer(bufferSize);
			fs.read(fd, buffer, 0, buffer.length/*bufferSize*/, fromOffset, // append '0' ?
				function(err, bytesRead, buffer) {
					fs.close(fd, function() {
						if (!err) {
							onSuccess(buffer)
						} else {
							onError(err)
						}
					});
				}
			);
		});
	});
};

MediaService.prototype.convertMediaToAsync = function (mediaFilePath, outputFormat) {
    return ensureConvertionOutputFolderExistsAsync()
        .then(function () {
            return convertMediaToAsync (mediaFilePath, outputFormat)
        });
};

MediaService.prototype.getMediaInfosAsync = function (mediaFilePath) {
	var deferred = Q.defer();

	// Only one convertion at a time
	if (_ffmpeg_process) {
		_ffmpeg_process.kill();
	}

	var cleanMediaFilePath = mediaFilePath.substring(1);

	probe(cleanMediaFilePath, function(err, probeData) {
		if (err) {
			deferred.reject(err);
		} else {
			deferred.resolve(probeData);
		}
	});

	return deferred.promise;

};

var ensureConvertionOutputFolderExistsAsync = function () {
	return Q.promise(function(onSuccess, _) {
		fs.exists(getConvertionOutputFolderPath(), function(folderExists) {
			onSuccess(folderExists);
		});
	})
	.then(function (folderExists) {
		if (!folderExists) {
			return createConvertionOutputFolderAsync();
		}
	});
};

var createConvertionOutputFolderAsync = function () {
	return Q.nfcall(fs.mkdir, getConvertionOutputFolderPath())
};

var generateConvertedMediaFilePath = function (mediaFilePath, outputFormat) {
    var ext = path.extname(mediaFilePath);

    var convertionFolderPath = getConvertionOutputFolderPath();
    var mediaFileNameNoExt = path.basename(mediaFilePath, ext);

    return path.join(convertionFolderPath, mediaFileNameNoExt + outputFormat);
};

var getConvertionOutputFolderPath = function () {
	return path.join(process.cwd(), _convertionOutputFolderRelativePath); // or resolve ?
};

var convertMediaToAsync = function (mediaFilePath, outputFormat) { // TODO Code smell, to much responsability
	var deferred = Q.defer();

	var outputFilePath = generateConvertedMediaFilePath(mediaFilePath, outputFormat);
	// Only one convertion at a time
	if (_ffmpeg_process) {
		_ffmpeg_process.kill();
	}

	_ffmpeg_process = child_process.spawn("ffmpeg", [
		"-i", // Next is input file
		mediaFilePath,
		"-y", // Overwrite output files without asking
		outputFilePath,
		"-loglevel", "error" // Only show error to avoid false positives in stderr
	]);
	// TODO try -map option (http://www.ffmpeg.org/ffmpeg.html)
	// TODO try -codec copy (http://www.ffmpeg.org/ffmpeg-all.html)
	// TODO try -t duration (output), -to position (output) (Xclusive Or), check interesting other next options

	var errorMsg = '';
	_ffmpeg_process.stderr.on('data', function (data) {
		errorMsg += data;
	});
	_ffmpeg_process.on('close', function (code) {
		var success = code === 0;
		if (success) {
			deferred.resolve(outputFilePath);
		} else {
			deferred.reject(errorMsg);
		}

		//console.log('transcoding with code:' + code);
	});

	return deferred.promise;
};

module.exports = MediaService;