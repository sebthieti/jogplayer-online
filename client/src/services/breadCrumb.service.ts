import {autoinject} from 'aurelia-framework';
import {ExplorerService} from './explorer.service';
import PlaylistExplorerService from './playlistExplorer.service';
import FileExplorerService from './fileExplorer.service';

export abstract class BreadCrumbService {
  constructor(private explorerService: ExplorerService) {
  }

  observeCurrentDir() {
    return this.explorerService
      .observeCurrentFolderContent()
      .map(folderContentVm => folderContentVm.path);
  }

  changeDir(folderPath) {
    this.explorerService.changeFolderByApiUrlAndResetSelection(folderPath);
  }
}

@autoinject
export class BreadCrumbPlaylistExplorerService extends BreadCrumbService {
  constructor(playlistExplorerService: PlaylistExplorerService) {
    super(playlistExplorerService);
  }
}

@autoinject
export class BreadCrumbFileExplorerService extends BreadCrumbService {
  constructor(playlistExplorerService: FileExplorerService) {
    super(playlistExplorerService);
  }
}
