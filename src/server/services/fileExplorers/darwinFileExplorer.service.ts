import * as path from 'path';
import FileExplorerService from './fileExplorer.service';
import FileInfo, {IFileInfo} from '../../entities/fileInfo';
import * as _ from 'lodash';

export default class DarwinFileExplorerService extends FileExplorerService {
  private osDirectPath = '/Volumes/';

  constructor() {
    super();
  }

  canHandleOs(osName): boolean {
    return osName === 'darwin';
  }

  normalizePathForCurrentOs(completePath): string {
    if (completePath === '/') {
      return '/Volumes/';
    } else if (completePath === '/root/') {
      return completePath.substr('/root/'.length - 1);
    } else if (completePath.startsWith('/~/')) {
      return completePath.substr(1);
    } else if (_.first(completePath) !== '/') {
      return `/${completePath}`;
    } else {
      return completePath;
    }
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

  getNewLineConstant(): string {
    return '\n';
  }

  getNetworkRoot(): string {
    return `${path.sep}${path.sep}`;
  }

  getLevelUpPath(): string {
    return `..${path.sep}`;
  }

  async getAvailableDrivesPathsAsync(): Promise<IFileInfo[]> {
    const cmd = 'df -P | grep /dev/ | awk \'{print $6}\'';
    const rawDrivesOutput = await this.getDrivesFromCmd(cmd);
    let driveArray = this.normalizeOutput(rawDrivesOutput);
    driveArray = this.prependHomeDir(driveArray);
    return this.castDrivesToFileInfoList(driveArray);
  }


  protected normalizeOutput(rawDrivesOutput: string): string[] {
    // TODO Turn to regex /^(.*)$/gm
    return rawDrivesOutput
      .split('\n')
      .filter(rawDrive => rawDrive !== '');
  }

  protected prependHomeDir(driveArray: string[]): string[] {
    return ['~/'].concat(driveArray);
  }

  protected castDrivesToFileInfoList(drives: string[]): IFileInfo[] {
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
