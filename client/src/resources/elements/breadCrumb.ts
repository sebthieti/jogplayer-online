import {bindable, autoinject} from 'aurelia-framework';
import {
  BreadCrumbFileExplorerService, BreadCrumbPlaylistExplorerService, BreadCrumbService
} from '../../services/breadCrumb.service';

@autoinject
export class BreadCrumbCustomElement {
  @bindable groupName: string;
  levels = [];

  private breadCrumbService: BreadCrumbService;
  private emptyArray = [];
  private rootPath = '/';
  private folderPath: string;

  constructor(
    private playlistExplorerService: BreadCrumbPlaylistExplorerService,
    private fileExplorerService: BreadCrumbFileExplorerService
  ) {
  }

  bind() {
    if (this.groupName === 'file-explorer') {
      this.breadCrumbService = this.fileExplorerService;
    } else if (this.groupName === 'playlist-finder') {
      this.breadCrumbService = this.playlistExplorerService;
    } else {
      throw new Error('BreadCrumb groupName: Must set groupName');
    }
  }

  attached() {
    this.breadCrumbService
      .observeCurrentDir()
      .do(dirPhysPath => {
        this.folderPath = dirPhysPath;
        this.levels = this.parseFolderPath(dirPhysPath);
      })
      .subscribeOnError(err => console.log(err));
  }

  goToLevel(index) {
    const folderPath = this.composePathToLevelIndex(index);
    this.breadCrumbService.changeDir(folderPath);
  }

  canShowPlayFolder(level) {
    // Only allow to play last folder in tree
    return level.index === this.levels.length-1;
  }

  innerPlayFolder(level) {
    level.playHole = !level.playHole;
  }

  private composePathToLevelIndex(index) {
    const levels = this.splitFolderPath(this.folderPath);
    let path = '';
    for (let currentLevel = 0; currentLevel <= index; currentLevel++) {
      path += levels[currentLevel];
      if (currentLevel > 0) {// TODO Revamp with join
        path += '/';
      }
    }
    return path;
  }

  private parseFolderPath(folderPath) {
    if (!folderPath) {
      return this.emptyArray;
    }

    return this.splitFolderPath(folderPath).map((lvl, index) => {
      return { name: lvl, index: index }
    });
  }

  private splitFolderPath(folderPath) {
    if (folderPath === this.rootPath) {
      return [ this.rootPath ];
    }
    let levels = folderPath.split("/");
    levels[0] = this.rootPath; // TODO Ugly
    return levels.filter(lvl => lvl !== '');
  }
}
