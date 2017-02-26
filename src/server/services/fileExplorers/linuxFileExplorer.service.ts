import * as child_process from 'child_process';
import * as path from 'path';

import FileExplorerService from './fileExplorer.service';
import FileInfo, {IFileInfo} from '../../entities/fileInfo';

export default class LinuxFileExplorerService extends FileExplorerService {
  constructor() {
    super();
  }

  canHandleOs(osName): boolean {
    return osName === 'linux';
  }

  normalizePathForCurrentOs(completePath): string {
    return (completePath.startsWith('/'))
      ? completePath
      : `/${completePath}`;
  }

  getNewLineConstant(): string {
    return '\n';
  }

  getNetworkRoot(): string {
    return `${path.sep}${path.sep}`;
  }

  getLevelUpPath(): string {
    return `..${path.sep}`;
  }

  getAvailableDrivesPathsAsync(): Promise<IFileInfo[]> {
    const cmd = 'df -P | grep /dev/sd | awk \'{print $6}\'';
    return this.getDrivesFromCmd(cmd)
      .then(rawDrivesOutput => {
        let driveArray = this.normalizeOutput(rawDrivesOutput);
        driveArray = this.prependHomeDir(driveArray);
        return this.castDrivesToFileInfoList(driveArray);
      });
  }

  private getDrivesFromCmd(cmd: string): Promise<string> {
    return new Promise((resolve, reject) => {
      child_process.exec(cmd, (err, stdOut, stdErr) => {
        if (err) {
          reject(`Error running drive list command: ${err}|${stdErr}`);
        } else {
          resolve(stdOut);
        }
      });
    });
  }

  private normalizeOutput(rawDrivesOutput: string): string[] {
    // TODO Turn to regex /^(.*)$/gm
    return rawDrivesOutput
      .split('\n')
      .filter(rawDrive => rawDrive !== '');
  }

  private prependHomeDir(driveArray: string[]): string[] {
    return ['~/'].concat(driveArray);
  }

  private castDrivesToFileInfoList(drives: string[]): IFileInfo[] {
    return drives.map(drive => {
      let safeDriveName = drive;
      if (safeDriveName !== '/' && safeDriveName[safeDriveName.length - 1] !== '/') {
        safeDriveName = drive + '/';
      }

      return new FileInfo({
        name: safeDriveName,
        filePath: safeDriveName,
        type: FileInfo.Directory,
        isRoot: true
      });
    });
  }
}
