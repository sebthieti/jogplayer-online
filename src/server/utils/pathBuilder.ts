import * as path from 'path';
import {IFileExplorerService} from '../services/fileExplorers/fileExplorer.service';
import * as stringHelpers from './stringHelpers';

export interface IPathBuilder {
  toAbsolutePath(playlistFilePath: string, mediaFileRelativePath: string): string;
  toRelativePath(playlistFilePath: string, mediaFileFullPath: string): string;
}

export default class PathBuilder implements IPathBuilder {
  constructor(private fileExplorer: IFileExplorerService) {
  }

  toAbsolutePath(playlistFilePath: string, mediaFileRelativePath: string): string {
    if (!playlistFilePath) {
      throw new Error('playlistFilePath is not defined');
    }
    if (!mediaFileRelativePath) {
      throw new Error('mediaFileRelativePath is not defined');
    }

    let resultPath;

    if (this.isRelativePathWithDots(mediaFileRelativePath)) {
      const levelUpPattern = this.fileExplorer.getLevelUpPath();
      const levelsUp = stringHelpers.count(mediaFileRelativePath, levelUpPattern);

      const mediaFileRelativePathWithoutDots = mediaFileRelativePath.substring(levelsUp * levelUpPattern.length);

      const newPlaylistBaseDirPath = this.getDirectoryUpPath(playlistFilePath, levelsUp);
      resultPath = path.resolve(newPlaylistBaseDirPath, mediaFileRelativePathWithoutDots);
    } else if (this.isUNCPath(mediaFileRelativePath) || this.isAbsolutePath(mediaFileRelativePath)) {
      resultPath = mediaFileRelativePath;
    } else {
      // Start from drive letter (TODO Test if can work other than windows)
      const drive = playlistFilePath.split(path.sep)[0];

      resultPath = path.resolve(drive, mediaFileRelativePath);
      if (!resultPath.toLowerCase().startsWith(playlistFilePath.substring(0, 2).toLowerCase())) {
        resultPath = playlistFilePath.substring(0, 2) + resultPath;
      }
    }

    return resultPath;
  }

  toRelativePath(playlistFilePath: string, mediaFileFullPath: string): string {
    return path.relative(playlistFilePath, mediaFileFullPath);
  }

  private isRelativePathWithDots(relativeFilePath: string): boolean {
    return relativeFilePath.startsWith('..' + path.sep);
  }

  private getDirectoryUpPath(fullFilePath: string, levelsUp: number): string {
    let dir = path.dirname(fullFilePath);

    while (levelsUp > 0 && dir != null) {
      dir = path.resolve(dir, '..');
      levelsUp--;
    }

    return dir;
  }

  private isUNCPath(filePath: string): boolean {
    return filePath.startsWith(this.fileExplorer.getNetworkRoot());
  }

  private isAbsolutePath(mediaFileRelativePath: string): boolean {
    return path.resolve(mediaFileRelativePath) === mediaFileRelativePath;
  }
}
