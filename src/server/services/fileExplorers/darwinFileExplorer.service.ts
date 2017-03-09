import * as path from 'path';
import FileExplorerService from './fileExplorer.service';
import {IFileInfo} from '../../entities/fileInfo';

export default class DarwinFileExplorerService extends FileExplorerService {
  private osDirectPath = '/Volumes/';

  constructor() {
    super();
  }

  canHandleOs(osName): boolean {
    return osName === 'darwin';
  }

  normalizePathForCurrentOs(completePath): string {
    return `/Volumes/${completePath}`;
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
    throw new Error('Not implemented exception');
  }
}
