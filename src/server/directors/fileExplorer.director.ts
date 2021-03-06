import * as path from 'path';
import * as _ from 'lodash';
import linkBuilder from '../utils/linkBuilder';
import {IFileExplorerService} from '../services/fileExplorers/fileExplorer.service';
import {IFolderContentDto} from '../dto/folderContent.dto';
import {IFileInfoDto} from '../dto/fileInfo.dto';
import {IFileInfo} from '../entities/fileInfo';
import {IUserModel} from '../models/user.model';
import {IUserPermissionsModel} from '../models/userPermissions.model';

export interface IFileExplorerDirector {
  getFolderContentAsync(urlPath: string, issuer: IUserModel): Promise<IFolderContentDto>;
  getFileInfoAsync(urlPath: string, issuer: IUserModel): Promise<IFileInfoDto>;
}

export default class FileExplorerDirector implements IFileExplorerDirector {
  constructor(private fileExplorerService: IFileExplorerService) {
  }

  getFolderContentAsync(urlPath: string, issuer: IUserModel): Promise<IFolderContentDto> {
    if (!this.acceptPath(urlPath, issuer.permissions)) {
      throw new Error('Unauthorized access'); // TODO Should become HTTP 403
    }
    return this.exploreFilePathAsync(urlPath, issuer);
  }

  getFileInfoAsync(urlPath: string, issuer: IUserModel): Promise<IFileInfoDto> {
    if (!this.acceptPath(urlPath, issuer.permissions)) {
      throw new Error('Unauthorized access'); // TODO Should become HTTP 403
    }

    return this.getFileInfoPathAsync(urlPath);
  }

  private async exploreFilePathAsync(urlPath: string, issuer: IUserModel): Promise<IFolderContentDto> {
    const isRoot = urlPath === '/';

    let files = await this.fileExplorerService.readFolderContentAsync(urlPath);
    files = this.filterAuthorizedPaths(files, isRoot, urlPath, issuer);
    // files = this.filterFilesIfNotRoot(files, isRoot);
    return linkBuilder.toFolderContentDto(urlPath, files);
  }

  private filterAuthorizedPaths(fileInfos: IFileInfo[], isRoot: boolean, urlPath: string, issuer: IUserModel): IFileInfo[] {
    return fileInfos.filter(fileInfo => {
      //var path = urlPath + fileInfo.getName() + (fileInfo.isDirectory() ? '/' : '');
      return this.acceptPath(fileInfo.filePath, issuer.permissions); // fileInfo.isDirectory()
    });
  }

  private filterFilesIfNotRoot(folderContent: IFileInfo[], isRoot: boolean): IFileInfo[] {
    return isRoot
      ? folderContent
      : this.filterBySupportedMediaTypes(folderContent);
  }

  private filterBySupportedMediaTypes(fileInfos: IFileInfo[]): IFileInfo[] {
    return fileInfos
      .filter(fileInfo => {
        if (fileInfo.isDirectory) {
          return true;
        }
        const ext = fileInfo.name.substring(fileInfo.name.lastIndexOf('.'));
        return this.isSupportedMediumExt(ext);
      });
  }

  private isSupportedMediumExt(ext: string): boolean {
    switch (ext) {
      //case ".mp3":
      //case ".flac":
      //case ".ogg":
      case '.m3u':
      case '.m3u8':
      case '.pls':
        return false;
      default:
        return true;
    }
  }

  private async getFileInfoPathAsync(urlPath: string): Promise<IFileInfoDto> {
    const file = await this.fileExplorerService.readFileInfoAsync(urlPath);

    let dirPath = path.dirname(urlPath);
    if (_.last(urlPath) !== '/') {
      dirPath += '/';
    }

    return linkBuilder.toFileInfoDto(dirPath, file);
  }

  private acceptPath(urlPath: string, permissions: IUserPermissionsModel): boolean {
    if (permissions.isRoot || permissions.isAdmin) {
      return true;
    }

    const isPathDenied = permissions.denyPaths.some(denyPath => {
      return urlPath.startsWith(denyPath);
    });
    return !isPathDenied;
  }
}
