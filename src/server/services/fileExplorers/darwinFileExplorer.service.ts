import * as path from 'path';
import BaseFileExplorerService from './fileExplorer.service';

export default class DarwinFileExplorerService extends BaseFileExplorerService {
  private osDirectPath = '/Volumes/';

  constructor() {
    super();
  }

  canHandleOs(osName) {
    return osName === 'darwin';
  }

  normalizePathForCurrentOs(completePath) {
    return `/Volumes/${completePath}`;
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
    return this.osDirectPath;
  }
}
