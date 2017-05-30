import {bindable, bindingMode, autoinject} from 'aurelia-framework';
import * as _ from 'lodash';

interface Level {
  index: number;
  name: string;
  playHole: boolean;
}

@autoinject
export class BreadCrumbCustomElement {
  @bindable({ defaultBindingModeBindingMode: bindingMode.twoWay })
  command: (obj: {folderPath: string}) => void;

  @bindable({ defaultBindingMode: bindingMode.oneTime })
  folderPath: string;

  private levels = [];
  private root = '/';

  folderPathChanged(folderPath: string) {
    this.levels = this.parseFolderPath(folderPath);
  }

  goToLevel(index: number) {
    const folderPath = this.composePathToLevelIndex(index);
    this.changeDir(folderPath);
  }

  private changeDir(dirPath: string) {
    this.command({folderPath: dirPath});
  }

  canShowPlayFolder(level: Level) {
    // Only allow to play last folder in tree
    return level.index === this.levels.length - 1;
  }

  innerPlayFolder(level: Level) {
    level.playHole = !level.playHole;
  }

  private composePathToLevelIndex(index: number): string {
    const levels = this.splitFolderPath(this.folderPath);
    return _(levels)
      .take(index+1)
      .reduce((path, level, index) => path + level + (index > 0 ? '/' : ''), '');
  }

  private parseFolderPath(folderPath: string) {
    if (!folderPath) {
      return [];
    }

    return this.splitFolderPath(folderPath).map((lvl, index) => {
      return { name: lvl, index: index }
    });
  }

  private splitFolderPath(folderPath: string): string[] {
    if (folderPath === this.root) {
      return [ this.root ];
    }
    return [
      this.root,
      ..._(folderPath.split('/')).drop(1).value()
    ];
  }
}
