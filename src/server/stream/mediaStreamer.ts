import {IMediaDirector} from '../directors/media.director';
import {IFileExplorerService} from '../services/fileExplorers/fileExplorer.service';

export interface IMediaStreamer {
  streamByMediaIdAndExt(mediaIdWithExt, req, res);
  streamByMediaPath(rawPath, req, res);
}

export default class MediaStreamer implements IMediaStreamer {
  constructor(
    private mediaDirector: IMediaDirector,
    private fileService: IFileExplorerService
  ) {
  }

  streamByMediaIdAndExt(mediaIdWithExt, req, res) {
    const mediaExtIndex = mediaIdWithExt.indexOf('.');
    const mediaExt = mediaIdWithExt.substring(mediaExtIndex);
    const mediaId = mediaIdWithExt.substring(0, mediaExtIndex);
    if (!mediaId) {
      res.status(400).send('A valid media id must be provided.');
      return;
    }
    if (!mediaExt) {
      res.status(400).send('Media doesn\'t seem to have an extension.');
      return;
    }

    const canUseChunkedStratagy = typeof req.headers.range !== 'undefined';

    let chunkParams;
    if (canUseChunkedStratagy) {
      chunkParams = this.parseChunkRequest(req);
    } else {
      chunkParams = { startOffset: 0, endOffset: '' };
    }

    return this.mediaDirector
      .getBinaryChunkAndFileSizeByIdAsync(mediaId, chunkParams.startOffset, chunkParams.endOffset, req.user)
      .then(dataSet =>
        this.prepareAndSendResponseWithData(res, canUseChunkedStratagy, chunkParams, dataSet)
      )
      .catch(err =>
        res.status(400).send(err)
      );
  }

  streamByMediaPath(rawPath, req, res) {
    const completePath = rawPath;
    const realPath = this.fileService.normalizePathForCurrentOs(completePath);

    const canUseChunkedStratagy = typeof req.headers.range !== 'undefined';

    let chunkParams;
    if (canUseChunkedStratagy) {
      chunkParams = this.parseChunkRequest(req);
    } else {
      chunkParams = { startOffset: 0, endOffset: '' };
    }

    return this.mediaDirector
      .renameMe(realPath, req.headers.accept, req.user)
      .then(mediaPath => this.mediaDirector.getBinaryChunkAndFileSizeByPathAsync(
        mediaPath,
        chunkParams.startOffset,
        chunkParams.endOffset
      ))
      .then(dataSet =>
        this.prepareAndSendResponseWithData(res, canUseChunkedStratagy, chunkParams, dataSet)
      )
      .catch(err => {
        res.status(400).send(err);
      });
  }

  private prepareAndSendResponseWithData(response, canUseChunkedStratagy, chunckParams, dataSet) {
    this.injectHeaderInResponse(response, canUseChunkedStratagy, chunckParams, dataSet.fileSize, dataSet.mimeType);
    this.injectDataStreamInResponse(response, dataSet.dataStream);
  }

  private injectHeaderInResponse(response, useChunkMode, chunckParams, fileSize, mimeType) {
    let header = {};

    header['Accept-Ranges'] = 'bytes';
    header['Content-Type'] = mimeType; // (mimeType == "audio/ogg") ? "application/ogg" : mimeType;

    if (useChunkMode) {
      const fileLength = fileSize;
      const startOffset = chunckParams.startOffset;
      const endOffset = chunckParams.endOffset || fileLength - 1; // - 1 because convert to 0 index based
      const chunkLength = (endOffset - startOffset) + 1; // + 1 because 0 index based

      header['Content-Range'] = `bytes ${startOffset}-${endOffset}/${fileLength}`;
      header['Content-Length'] = chunkLength;
      header['Transfer-Encoding'] = 'chunked';
      //header["Connection"] = "close";

      //console.log(header);

      response.writeHead(206, header);
    } else {
      // Reply to normal un-chunked request
      header['Content-Length'] = fileSize;
      header['Connection'] = 'keep-alive';

      response.writeHead(200, header);
    }
  }

  private injectDataStreamInResponse(response, dataStream) {
    dataStream.pipe(response);
  }

  private parseChunkRequest (request) {
    if (typeof request.headers.range === 'undefined') {
      throw new Error('Only handle chunked requests');
    }

    const range = request.headers.range;
    const parts = range.replace(/bytes=/, '').split('-');
    const startAsString = parts[0];
    const endAsString = parts[1];

    return {
      startOffset: parseInt(startAsString, 10),
      endOffset: endAsString && parseInt(endAsString, 10)
    };
  }
}
