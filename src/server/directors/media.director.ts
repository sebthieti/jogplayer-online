import * as path from 'path';
import * as _ from 'lodash';
import * as fsHelpers from '../utils/fsHelpers';
import mediaHelper from '../utils/mediaHelper';
import {IMediaRepository} from '../repositories/media.repository';
import {IMediaService} from '../services/media.service';
import {IFileExplorerService} from '../services/fileExplorers/fileExplorer.service';
import {User} from '../models/user.model';
import {MediumDocument} from '../models/medium.model';
import {ReadStream} from 'fs';
import {UserPermissions} from '../models/userPermissions.model';

export interface IMediaDirector {
  getMediumByIdAndPlaylistIdAsync(playlistId: string, mediumId: string, issuer: User): Promise<MediumDocument>);
  getBinaryChunkAndFileSizeByIdAsync(
    mediumId: string,
    fromOffset: number,
    toOffset: number,
    issuer: User
  ): Promise<{mimeType: string, dataStream: ReadStream, fileSize: number}>;
  getBinaryChunkAndFileSizeByPathAsync(
    mediaPath: string,
    fromOffset: number,
    toOffset: number
  ): Promise<{mimeType: string, dataStream: ReadStream, fileSize: number}>;
  renameMe(mediaFilePath: string, browserFormats: string, issuer: User): Promise<string>;
}

export default class MediaDirector implements IMediaDirector {
  constructor(
    private mediaRepository: IMediaRepository,
    private mediaService: IMediaService,
    private fileExplorerService: IFileExplorerService
  ) {
  }

  getMediumByIdAndPlaylistIdAsync(playlistId: string, mediumId: string, issuer: User): Promise<MediumDocument> {
    return this.mediaRepository.getMediumByIdAndPlaylistIdAsync(playlistId, mediumId, issuer);
  }

  async getBinaryChunkAndFileSizeByIdAsync(
    mediumId: string,
    fromOffset: number,
    toOffset: number,
    issuer: User
  ): Promise<{mimeType: string, dataStream: ReadStream, fileSize: number}> {
    const medium = await this.mediaRepository
      .getMediaByIdAsync(mediumId, issuer);

    if (!this.acceptPath(medium.filePath, issuer.permissions)) {
      throw new Error('Unauthorized access');
    }

    // TODO Later use repositories to save fileSize (save file size)
    let offsetAndFileSize = await this.getOffsetAndFileSizeAsync(medium.filePath, toOffset);
    offsetAndFileSize.media = medium;

    const safeToOffset = toOffset || offsetAndFileSize.fileSize;
    return {
      mimeType: offsetAndFileSize.media.mimeType,
      dataStream: this.mediaService.getFileStream(offsetAndFileSize.media.filePath, fromOffset, safeToOffset),
      fileSize: offsetAndFileSize.fileSize
    };
  }

  async getBinaryChunkAndFileSizeByPathAsync(
    mediaPath: string,
    fromOffset: number,
    toOffset: number
  ): Promise<{mimeType: string, dataStream: ReadStream, fileSize: number}> {
    const realPath = this.giveRealPath(mediaPath);
    const dataSet = await this.getOffsetAndFileSizeAsync(realPath, toOffset);
    const safeToOffset = toOffset || dataSet.fileSize;
    return {
      mimeType: mediaHelper.getMimeTypeFromPath(mediaPath),
      dataStream: this.mediaService.getFileStream(mediaPath, fromOffset, safeToOffset),
      fileSize: dataSet.fileSize
    };
  }

  async renameMe(mediaFilePath: string, browserFormats: string, issuer: User): Promise<string> {
    if (!this.acceptPath(mediaFilePath, issuer.permissions)) {
      throw new Error('Unauthorized access');
    }

    const exists = await fsHelpers.checkFileExistsAsync(mediaFilePath);

    let matchSet: {exists: boolean, mediaFilePath: string};
    if (exists) {
      matchSet = await {
        exists: exists,
        mediaFilePath: mediaFilePath
      };
    } else {
      const closestMediumFile = await this.findClosestMatchAsync(mediaFilePath);
      matchSet = {
        exists: exists,
        mediaFilePath: closestMediumFile
      };
    }

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
  }

  private async findClosestMatchAsync(mediaFilePath: string): Promise<string> {
    const mediumFileName = path.basename(mediaFilePath).substring(0, path.basename(mediaFilePath).lastIndexOf('.'));
    const dirPath = path.dirname(mediaFilePath) + path.sep;

    const files = await this.fileExplorerService.readFolderContentAsync(dirPath);
    let similarFiles = files.filter(file => {
      let filename = path.basename(file.name).substring(0, path.basename(mediaFilePath).lastIndexOf('.'));
      return filename === mediumFileName;
    });

    // May be null if original file has been removed
    // TODO Maybe use ffprobe to get the biggest one's rate if more than 1
    return similarFiles.length > 0
      ? similarFiles[0].filePath
      : '';
  }

  private acceptPath(urlPath: string, permissions: UserPermissions): boolean {
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

  private async getOffsetAndFileSizeAsync(
    mediaPath: string,
    toOffset: number
  ): Promise<{ offset: number, fileSize: number }> {
    const fileSize = await this.mediaService.getFileSizeAsync(mediaPath);
    return {offset: toOffset, fileSize: fileSize};
  }

  private giveRealPath(mediaPath: string): string {
    return mediaPath;
  }
}
