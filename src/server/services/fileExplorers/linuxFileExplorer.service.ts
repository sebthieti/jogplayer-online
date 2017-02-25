import * as child_process from 'child_process';
import * as path from 'path';
import * as _ from 'lodash';

import BaseFileExplorerService from './fileExplorer.service';
import FileInfo from '../../entities/fileInfo';

export default class LinuxFileExplorerService extends BaseFileExplorerService {
  constructor() {
    super();
  }

  canHandleOs(osName) {
    return osName === 'linux';
  }

  normalizePathForCurrentOs(completePath) {
    return (completePath.startsWith('/'))
      ? completePath
      : `/${completePath}`;
  }

  getNewLineConstant() {
    return '\n';
  }

  getNetworkRoot() {
    return `${path.sep}${path.sep}`;
  }

  getLevelUpPath() {
    return `..${path.sep}`;
  }

  getAvailableDrivesPathsAsync() {
    var cmd = 'df -P | grep /dev/sd | awk \'{print $6}\'';
    return this.getDrivesFromCmd(cmd)
      .then(rawDrivesOutput => {
        let driveArray = this.normalizeOutput(rawDrivesOutput);
        driveArray = this.prependHomeDir(driveArray);
        return this.castDrivesToFileInfoList(driveArray);
      });
  }

  private getDrivesFromCmd(cmd) {
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

  private normalizeOutput(rawDrivesOutput) {
    // TODO Turn to regex /^(.*)$/gm
    return _(rawDrivesOutput.split('\n'))
      .filter(rawDrive => rawDrive !== '')
      .value();
  }

  private prependHomeDir(driveArray) {
    return ['~/'].concat(driveArray);
  }

  private castDrivesToFileInfoList(drives) {
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
