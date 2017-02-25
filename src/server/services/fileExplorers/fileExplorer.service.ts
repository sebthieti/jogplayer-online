import * as fs from 'fs';
import {Stats} from 'fs';
import * as path from 'path';
import * as _ from 'lodash';
import FileInfo, {IFileInfo} from '../../entities/fileInfo';
import {nfcall} from '../../utils/promiseHelpers';

export interface IFileExplorerService {
  readFileInfoAsync(urlPath);
  readFolderContentAsync(urlPath);
  normalizePathForCurrentOs(urlPath): string;
  canHandleOs(osName: string): boolean;
  getAvailableDrivesPathsAsync();
  getNewLineConstant(): string;
  getNetworkRoot(): string;
  getLevelUpPath(): string;
}

export default class BaseFileExplorerService implements IFileExplorerService {
  readFileInfoAsync(urlPath) {
    const realPath = this.mapUrlToServerPath.call(this, urlPath);
    const fileName = path.basename(realPath);
    return this.queryFileStatAsync(realPath, fileName);
  }

  readFolderContentAsync(urlPath) {
    const isRoot = urlPath === '/';

    // If root, then show all drives. Procedure may depend on os
    if (isRoot) {
      return this.getAvailableDrivesPathsAsync();
    } else {
      const realPath = this.mapUrlToServerPath(urlPath);
      return this.performFolderReadDirAsync(realPath, urlPath);
    }
  }

  normalizePathForCurrentOs(urlPath): string {
    throw new Error('abstract member');
  }

  canHandleOs(osName: string): boolean {
    throw new Error('abstract member');
  }

  getAvailableDrivesPathsAsync() {
    throw new Error('abstract member');
  }

  getNewLineConstant(): string {
    throw new Error('abstract member');
  }

  getNetworkRoot(): string {
    throw new Error('abstract member');
  }

  getLevelUpPath(): string {
    throw new Error('abstract member');
  }

  private performFolderReadDirAsync(basePath, urlPath) {
    return nfcall(fs.readdir, basePath)
      .then(fileNames => {
        return this.spreadFileStatsQueriesInDirAsync(basePath, fileNames);
      })
      .then(this.filterByValidFiles)
      .then(this.filterByOnlyVisibleFiles);
  }

  private filterByValidFiles(fileInfos) {
    return _(fileInfos)
      .filter(fileInfo => {
        return fileInfo.isValid();
      })
      .value();
  }

  private filterByOnlyVisibleFiles(fileInfos) {
    return _(fileInfos)
      .filter(fileInfo => {
        return fileInfo.name[0] !== '.' &&
          fileInfo.name.toLowerCase() !== '$recycle.bin' &&
          fileInfo.name.toLowerCase() !== 'system volume information' &&
          fileInfo.name.toLowerCase().substring(0, 6) !== 'found.';
      })
      .value();
  }

  private mapUrlToServerPath(urlPath) {
    return this.normalizePathForCurrentOs(urlPath);
  }

  private spreadFileStatsQueriesInDirAsync(basePath, fileNames) {
    const fileStatPromises = fileNames.map(fileName => {
      const fullFilePath = basePath + fileName;
      return this.queryFileStatAsync(fullFilePath, fileName);
    });
    return Promise.all(fileStatPromises);
  }

  private queryFileStatAsync (fullFilePath, fileName) {
    return nfcall(fs.stat, fullFilePath)
      .then((fileStat: Stats) => { // onSuccess
        if (!fileStat) {
          return FileInfo.Invalid;
        }
        return new FileInfo({
          filePath: fullFilePath + (fileStat.isDirectory() ? '/' : ''),
          name: fileName,
          type: fileStat.isDirectory() ? FileInfo.Directory : FileInfo.File,
          isRoot: false
        } as IFileInfo);
      }, err => { // onError
        // errno:34 code:ENOENT when no drive
        // TODO What error for drive empty CD drive?
        throw new Error(`An error occured while accessing the path ${fullFilePath} :${err.message}`);
      })
      .catch(() => new FileInfo({} as IFileInfo));
  }
}
