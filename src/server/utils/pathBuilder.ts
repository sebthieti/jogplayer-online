import * as path from 'path';
import {IFileExplorerService} from '../services/fileExplorers/fileExplorer.service';

export interface IPathBuilder {
  toAbsolutePath(playlistFilePath, mediaFileRelativePath);
  toRelativePath(playlistFilePath, mediaFileFullPath);
}

export default class PathBuilder implements IPathBuilder {
  constructor(private fileExplorer: IFileExplorerService) {
  }

  toAbsolutePath(playlistFilePath, mediaFileRelativePath) {
    if (!playlistFilePath) {
      throw new Error('playlistFilePath is not defined');
    }
    if (!mediaFileRelativePath) {
      throw new Error('mediaFileRelativePath is not defined');
    }

    let resultPath;

    if (this.isRelativePathWithDots(mediaFileRelativePath)) {
      const levelUpPattern = this.fileExplorer.getLevelUpPath();
      const levelsUp = mediaFileRelativePath.count(levelUpPattern);

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

  toRelativePath(playlistFilePath, mediaFileFullPath) {
    return path.relative(playlistFilePath, mediaFileFullPath);
  }

  private isRelativePathWithDots(relativeFilePath) {
    return relativeFilePath.startsWith('..' + path.sep);
  }

  private getDirectoryUpPath(fullFilePath, levelsUp) {
    var dir = path.dirname(fullFilePath);

    while (levelsUp > 0 && dir != null) {
      dir = path.resolve(dir, '..');
      levelsUp--;
    }

    return dir;
  }

  private isUNCPath(filePath) {
    return filePath.startsWith(this.fileExplorer.getNetworkRoot());
  }

  private isAbsolutePath(mediaFileRelativePath) {
    return path.resolve(mediaFileRelativePath) === mediaFileRelativePath;
  }
}
