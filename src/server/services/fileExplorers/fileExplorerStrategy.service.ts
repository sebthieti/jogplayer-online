import * as os from 'os';

import DarwinFileExplorerService from './darwinFileExplorer.service';
import LinuxFileExplorerService from './linuxFileExplorer.service';
import WinFileExplorerService from './winFileExplorer.service';
import {IFileExplorerService} from './fileExplorer.service';

export default class FileExplorerStrategyService {
  private fileExplorerServices: IFileExplorerService[] = [
    new WinFileExplorerService(),
    new DarwinFileExplorerService(),
    new LinuxFileExplorerService()
  ];

  buildFileExplorerService(): IFileExplorerService {
    return this.findAndBuildFileExplorerForCurrentOs();
  }

  private findAndBuildFileExplorerForCurrentOs(): IFileExplorerService {
    const currentOs = os.platform();
    return this.fileExplorerServices.find(svc => svc.canHandleOs(currentOs));
  }
}
