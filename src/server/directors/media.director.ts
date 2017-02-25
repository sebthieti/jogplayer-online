import * as path from 'path';
import * as _ from 'lodash';
import * as fsHelpers from '../utils/fsHelpers';
import mediaHelper from '../utils/mediaHelper';
import {IMediaRepository} from '../repositories/media.repository';
import {IMediaService} from '../services/media.service';
import {IFileExplorerService} from '../services/fileExplorers/fileExplorer.service';

export interface IMediaDirector {
  getMediumByIdAndPlaylistIdAsync(playlistId, mediumId, issuer);
  getBinaryChunkAndFileSizeByIdAsync(mediumId, fromOffset, toOffset, issuer);
  getBinaryChunkAndFileSizeByPathAsync(mediaPath, fromOffset, toOffset);
  renameMe(mediaFilePath, browserFormats, issuer);
}

export default class MediaDirector implements IMediaDirector {
  constructor(
    private mediaRepository: IMediaRepository,
    private mediaService: IMediaService,
    private fileExplorerService: IFileExplorerService
  ) {
  }

  getMediumByIdAndPlaylistIdAsync(playlistId, mediumId, issuer) {
    return this.mediaRepository.getMediumByIdAndPlaylistIdAsync(playlistId, mediumId, issuer);
  }

  getBinaryChunkAndFileSizeByIdAsync(mediumId, fromOffset, toOffset, issuer) {
    return this.mediaRepository
      .getMediaByIdAsync(mediumId, issuer)
      .then(medium => {
        if (!this.acceptPath(medium.filePath, issuer.permissions)) {
          throw new Error('Unauthorized access');
        }
        return medium;
      })
      .then(medium => {
        return this.getOffsetAndFileSizeAsync(medium.filePath, toOffset) // TODO Later use repositories to save fileSize (save file size)
          .then(offsetAndFileSize => {
            offsetAndFileSize.media = medium;
            return offsetAndFileSize;
          });
      })
      .then(dataSet => {
        const safeToOffset = toOffset || dataSet.fileSize;
        return {
          mimeType: dataSet.media.mimeType,
          dataStream: this.mediaService.getFileStream(dataSet.media.filePath, fromOffset, safeToOffset),
          fileSize: dataSet.fileSize
        };
      });
  }

  getBinaryChunkAndFileSizeByPathAsync(mediaPath, fromOffset, toOffset) {
    return Promise
      .resolve(this.giveRealPath(mediaPath))
      .then(realPath => this.getOffsetAndFileSizeAsync(realPath, toOffset))
      .then(dataSet => {
        const safeToOffset = toOffset || dataSet.fileSize;
        return {
          mimeType: mediaHelper.getMimeTypeFromPath(mediaPath),
          dataStream: this.mediaService.getFileStream(mediaPath, fromOffset, safeToOffset),
          fileSize: dataSet.fileSize
        };
      });
  }

  renameMe(mediaFilePath, browserFormats, issuer) {
    if (!this.acceptPath(mediaFilePath, issuer.permissions)) {
      throw new Error('Unauthorized access');
    }

    return fsHelpers.checkFileExistsAsync(mediaFilePath)
      .then(exists => {
        if (exists) {
          return {
            exists: exists,
            mediaFilePath: mediaFilePath
          };
        }
        return this.findClosestMatchAsync(mediaFilePath)
          .then(closestMediumFile => {
            return {
              exists: exists,
              mediaFilePath: closestMediumFile
            };
          });
      })
      .then(matchSet => {
        if (!matchSet.exists && matchSet.mediaFilePath === '') {
          throw new Error('No file matches');
        }
        if (matchSet.exists) {
          return matchSet.mediaFilePath;
        }
        // Do convert, then return path
        return this.mediaService.convertMediumToAsync(
          matchSet.mediaFilePath,
          path.extname(mediaFilePath)
        );
      });
  }

  private findClosestMatchAsync(mediaFilePath) {
    let mediumFileName = path.basename(mediaFilePath).substring(0, path.basename(mediaFilePath).lastIndexOf('.'));
    let dirPath = path.dirname(mediaFilePath) + path.sep;
    return this.fileExplorerService
      .readFolderContentAsync(dirPath)
      .then(files => {
        let similarFiles = files.filter(file => {
          let filename = path.basename(file.name).substring(0, path.basename(mediaFilePath).lastIndexOf('.'));
          return filename === mediumFileName;
        });

        // May be null if original file has been removed
        // TODO Maybe use ffprobe to get the biggest one's rate if more than 1
        return similarFiles.length > 0
          ? similarFiles[0].filePath
          : '';
      });
  }

  private acceptPath(urlPath, permissions) {
    if (permissions.isRoot || permissions.isAdmin) {
      return true;
    }

    const isPathDenied = _.some(permissions.denyPaths, denyPath => {
      return urlPath.startsWith(denyPath);
    });
    return !isPathDenied;

    //var hasAcceptedPath = _.any(permissions.allowPaths, function(allowPath) {
    //	return urlPath.startsWith(allowPath);
    //});
    //
    //return hasAcceptedPath;
  }

  private getOffsetAndFileSizeAsync(mediaPath, toOffset) {
    return this.mediaService
      .getFileSizeAsync(mediaPath)
      .then(fileSize => {
        return { offset: toOffset, fileSize: fileSize };
      });
  }

  private giveRealPath(mediaPath) {
    return mediaPath;
  }
}
