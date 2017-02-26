import * as fs from 'fs';
import {Stats} from 'fs';
import * as path from 'path';
import FileInfo, {IFileInfo} from '../../entities/fileInfo';
import {nfcall} from '../../utils/promiseHelpers';

export interface IFileExplorerService {
  readFileInfoAsync(urlPath: string): Promise<IFileInfo>;
  readFolderContentAsync(urlPath: string): Promise<IFileInfo[]>;
  normalizePathForCurrentOs(urlPath: string): string;
  canHandleOs(osName: string): boolean;
  getAvailableDrivesPathsAsync(): Promise<IFileInfo[]>;
  getNewLineConstant(): string;
  getNetworkRoot(): string;
  getLevelUpPath(): string;
}

export default class FileExplorerService implements IFileExplorerService {
  readFileInfoAsync(urlPath: string): Promise<IFileInfo> {
    const realPath = this.mapUrlToServerPath.call(this, urlPath);
    const fileName = path.basename(realPath);
    return this.queryFileStatAsync(realPath, fileName);
  }

  readFolderContentAsync(urlPath: string): Promise<IFileInfo[]> {
    const isRoot = urlPath === '/';

    // If root, then show all drives. Procedure may depend on os
    if (isRoot) {
      return this.getAvailableDrivesPathsAsync();
    } else {
      const realPath = this.mapUrlToServerPath(urlPath);
      return this.performFolderReadDirAsync(realPath, urlPath);
    }
  }

  normalizePathForCurrentOs(urlPath: string): string {
    throw new Error('abstract member');
  }

  canHandleOs(osName: string): boolean {
    throw new Error('abstract member');
  }

  getAvailableDrivesPathsAsync(): Promise<IFileInfo[]> {
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

  private async performFolderReadDirAsync(basePath: string, urlPath: string): Promise<IFileInfo[]> {
    const fileNames = await nfcall<string[]>(fs.readdir, basePath);
    let fileInfos = await this.spreadFileStatsQueriesInDirAsync(basePath, fileNames);
    fileInfos = await this.filterByValidFiles(fileInfos);
    return await this.filterByOnlyVisibleFiles(fileInfos);
  }

  private filterByValidFiles(fileInfos: IFileInfo[]): IFileInfo[] {
    return fileInfos.filter(fileInfo => fileInfo.isValid);
  }

  private filterByOnlyVisibleFiles(fileInfos: IFileInfo[]): IFileInfo[] {
    return fileInfos.filter(fileInfo =>
      fileInfo.name[0] !== '.' &&
      fileInfo.name.toLowerCase() !== '$recycle.bin' &&
      fileInfo.name.toLowerCase() !== 'system volume information' &&
      fileInfo.name.toLowerCase().substring(0, 6) !== 'found.'
    );
  }

  private mapUrlToServerPath(urlPath: string): string {
    return this.normalizePathForCurrentOs(urlPath);
  }

  private async spreadFileStatsQueriesInDirAsync(basePath: string, fileNames: string[]): Promise<IFileInfo[]> {
    const fileStatPromises = fileNames.map(fileName => {
      const fullFilePath = basePath + fileName;
      return this.queryFileStatAsync(fullFilePath, fileName);
    });
    return Promise.all(fileStatPromises);
  }

  private async queryFileStatAsync(fullFilePath: string, fileName: string): Promise<IFileInfo> {
    try {
      const fileStat = await nfcall<Stats>(fs.stat, fullFilePath);
      if (!fileStat) {
        return FileInfo.Invalid;
      }

      return new FileInfo({
        filePath: fullFilePath + (fileStat.isDirectory() ? '/' : ''),
        name: fileName,
        type: fileStat.isDirectory() ? FileInfo.Directory : FileInfo.File,
        isRoot: false
      } as IFileInfo);
    } catch (err) { // Can happen if errno:34 code:ENOENT when no drive
      return new FileInfo({} as IFileInfo);
    }
  }
}
