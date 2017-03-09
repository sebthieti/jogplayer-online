import * as child_process from 'child_process';
import * as path from 'path';
import FileExplorerService from './fileExplorer.service';
import FileInfo, {IFileInfo} from '../../entities/fileInfo';

export default class WinFileExplorerService extends FileExplorerService {
  private anyDriveLetterPattern = /([a-zA-Z]:)/g;

  constructor() {
    super();
  }

  canHandleOs(osName: string): boolean {
    return osName === 'win32';
  }

  normalizePathForCurrentOs(completePath: string): string {
    if (completePath.startsWith('/')) {
      return completePath.substring(1).replace(/\//g, path.sep);
    }
    return completePath.replace(/\//g, path.sep);
  }

  getNewLineConstant(): string {
    return '\r\n';
  }

  getNetworkRoot(): string {
    return `${path.sep}${path.sep}`;
  }

  getLevelUpPath(): string {
    return `..${path.sep}`;
  }

  async getAvailableDrivesPathsAsync(): Promise<IFileInfo[]> {
    return new Promise<IFileInfo[]>((resolve, reject) => {
      // For Windows we need a process to get for us drives paths
      const cmd = 'wmic logicaldisk get name';
      child_process.exec(cmd, (err, stdOut, stdErr) => {
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
              isRoot: true,
              isDirectory: false,
              isFile: false,
              isValid: false
            })
          )
        );
      });
    });
  }
}
