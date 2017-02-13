'use strict';

var _mediaDirector,
	_fileService;

function MediaStreamer (mediaDirector, fileService) {
	_mediaDirector = mediaDirector;
    _fileService = fileService;
}

MediaStreamer.prototype.streamByMediaIdAndExt = function(mediaIdWithExt, request, response) {
	var mediaExtIndex = mediaIdWithExt.indexOf('.');
	var mediaExt = mediaIdWithExt.substring(mediaExtIndex);
	var mediaId = mediaIdWithExt.substring(0, mediaExtIndex);
	if (!mediaId) {
		response.send(400, "A valid media id must be provided.");
		return;
	}
	if (!mediaExt) {
		response.send(400, "Media doesn't seem to have an extension.");
		return;
	}

	var canUseChunkedStratagy = typeof request.headers.range !== 'undefined';

	var chunckParams;
	if (canUseChunkedStratagy) {
		chunckParams = parseChunkRequest(request);
	} else {
		chunckParams = { startOffset: 0, endOffset: '' }
	}

	return _mediaDirector
		.getBinaryChunkAndFileSizeByIdAsync(mediaId, chunckParams.startOffset, chunckParams.endOffset)
		.then(function(dataSet) {
			prepareBodyResponse(canUseChunkedStratagy, chunckParams, dataSet.fileSize, dataSet.mimeType, dataSet.data, response);
		})
		.catch(function(err) {
			response.send(400, err) }
		)
		.done();
};

MediaStreamer.prototype.streamByMediaPath = function(rawPath, request, response) {
	var completePath = decodeURI(rawPath);
    var realPath = _fileService.normalizePathForCurrentOs(completePath);//adaptPathToSystem(completePath);

	var canUseChunkedStratagy = typeof request.headers.range !== 'undefined';

	var chunckParams;
	if (canUseChunkedStratagy) {
		chunckParams = parseChunkRequest(request);
	} else {
		chunckParams = { startOffset: 0, endOffset: '' }
	}

	return _mediaDirector
        .ensureReadableMediaAsync(realPath, request.headers.accept)
		.then(function(mediaPath) {
			return _mediaDirector.getBinaryChunkAndFileSizeByPathAsync(mediaPath, chunckParams.startOffset, chunckParams.endOffset)
		})
		.then(function(dataSet) {
			prepareBodyResponse(canUseChunkedStratagy, chunckParams, dataSet.fileSize, dataSet.mimeType, dataSet.data, response);
		})
		.catch(function(err) {
			response.send(400, err)
		})
		.done();
};

var prepareBodyResponse = function (useChunkMode, chunckParams, fileSize, mimeType, data, response) {
	var header = {};
	if (useChunkMode) {
		var fileLength = fileSize;
		var startOffset = chunckParams.startOffset;
		var endOffset = chunckParams.endOffset || fileLength - 1; // - 1 because convert to 0 index based
		var chunckLength = (endOffset - startOffset) + 1; // + 1 because 0 index based

		header["Content-Range"] = "bytes " + startOffset + "-" + endOffset + "/" + fileLength;
		header["Accept-Ranges"] = "bytes";
		header["Content-Length"] = chunckLength;
		header['Transfer-Encoding'] = 'chunked';
		header["Connection"] = "close";
		header["Content-Type"] = mimeType;

		response.writeHead(206, header);
		response.write(data, "binary");
	} else {
		// reply to normal un-chunked request
		response.writeHead(200, header);
		response.write(data, "binary");
	}

	response.end();
};

var parseChunkRequest = function (request) {
	if (typeof request.headers.range === 'undefined') {
		throw "Only handle chunked requests";
	}

	var chunkParams = {};

	var range = request.headers.range;
	var parts = range.replace(/bytes=/, "").split("-");
	var startAsString = parts[0];
	var endAsString = parts[1];

	chunkParams.startOffset = parseInt(startAsString, 10);
	chunkParams.endOffset = endAsString && parseInt(endAsString, 10);

	return chunkParams;
};

module.exports = MediaStreamer;