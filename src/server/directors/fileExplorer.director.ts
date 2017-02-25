import * as path from 'path';
import linkBuilder from '../utils/linkBuilder';
import {IFileExplorerService} from '../services/fileExplorers/fileExplorer.service';

export interface IFileExplorerDirector {
  getFolderContentAsync(urlPath, issuer);
  getFileInfoAsync(urlPath, issuer);
}

export default class FileExplorerDirector implements IFileExplorerDirector {
  constructor(private fileExplorerService: IFileExplorerService) {
  }

  getFolderContentAsync(urlPath, issuer) {
    if (!this.acceptPath(urlPath, issuer.permissions)) {
      throw new Error('Unauthorized access'); // TODO Should become HTTP 403
    }
    return this.exploreFilePathAsync(urlPath, issuer);
  }

  getFileInfoAsync(urlPath, issuer) {
    if (!this.acceptPath(urlPath, issuer.permissions)) {
      throw new Error('Unauthorized access'); // TODO Should become HTTP 403
    }

    return this.getFileInfoPathAsync(urlPath);
  }

  private exploreFilePathAsync(urlPath, issuer) {
    const isRoot = urlPath === '/';
    return this.fileExplorerService
      .readFolderContentAsync(urlPath)
      .then(files => {
        return this.filterAuthorizedPaths(files, isRoot, urlPath, issuer);
      })
      .then(files => {
        return this.filterFilesIfNotRoot(files, isRoot);
      })
      .then(files => {
        return linkBuilder.toFolderContentDto(urlPath, files);
      });
  }

  private filterAuthorizedPaths(fileInfos, isRoot, urlPath, issuer) {
    return fileInfos
      .filter(fileInfo => {
        //var path = urlPath + fileInfo.getName() + (fileInfo.isDirectory() ? '/' : '');
        return this.acceptPath(fileInfo.filePath, issuer.permissions); // fileInfo.isDirectory()
      });
  }

  private filterFilesIfNotRoot(folderContent, isRoot) {
    return isRoot
      ? folderContent
      : this.filterBySupportedMediaTypes(folderContent);
  }

  private filterBySupportedMediaTypes(fileInfos) {
    return fileInfos
      .filter(fileInfo => {
        if (fileInfo.isDirectory) {
          return true;
        }
        const ext = fileInfo.name.substring(fileInfo.name.lastIndexOf('.'));
        return this.isSupportedMediumExt(ext);
      });
  }

  private isSupportedMediumExt(ext) {
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

  private getFileInfoPathAsync(urlPath) {
    return this.fileExplorerService
      .readFileInfoAsync(urlPath)
      .then(file => {
        const dirPath = path.dirname(urlPath) + '/';
        return linkBuilder.toFileInfoDto(dirPath, file);
      });
  }

  private acceptPath(urlPath, permissions) {
    if (permissions.isRoot || permissions.isAdmin) {
      return true;
    }

    const isPathDenied = permissions.denyPaths.some(denyPath => {
      return urlPath.startsWith(denyPath);
    });
    return !isPathDenied;

    //var hasAcceptedPath = _.any(permissions.allowPaths, function(allowPath) {
    //	return urlPath.startsWith(allowPath);
    //});
    //
    //return hasAcceptedPath;
  }
}
