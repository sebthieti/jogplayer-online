import * as child_process from 'child_process';
import * as path from 'path';
import BaseFileExplorerService from './fileExplorer.service';
import FileInfo from '../../entities/fileInfo';

export default class WinFileExplorerService extends BaseFileExplorerService {
  private anyDriveLetterPattern = /([a-zA-Z]:)/g;

  constructor() {
    super();
  }

  canHandleOs(osName) {
    return osName === 'win32';
  }

  normalizePathForCurrentOs(completePath) {
    if (completePath.startsWith('/')) {
      return completePath.substring(1).replace(/\//g, path.sep);
    }
    return completePath.replace(/\//g, path.sep);
  }

  getNewLineConstant() {
    return '\r\n';
  }

  getNetworkRoot() {
    return `${path.sep}${path.sep}`;
  }

  getLevelUpPath() {
    return `..${path.sep}`;
  }

  getAvailableDrivesPathsAsync() {
    return new Promise((resolve, reject) => {
      // For Windows we need a process to get for us drives paths
      const exec = child_process.exec;
      const cmd = 'wmic logicaldisk get name';
      exec(cmd, (err, stdOut, stdErr) => {
        if (err) {
          reject(`Error running wmic logicaldisk command: ${err}|${stdErr}`);
          return;
        }

        resolve(stdOut
          .match(this.anyDriveLetterPattern)
          .map(drive => new FileInfo({
              name: drive,
              filePath: `/${drive}/`,
              type: FileInfo.Directory,
              isRoot: true
            })
          )
        );
      });
    });
  }
}
