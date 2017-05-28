import {FileViewModel} from './file.viewModel';
import FolderModel from '../models/folder.model';

export class FolderViewModel extends FolderModel {
  files: FileViewModel[];
  canExecuteFolderUp: boolean;
  isActive = true;
  selected = false;
  hasError = false;

  constructor(folder: FolderModel) {
    super(folder.path);
    Object.assign(this, folder);

    this.canExecuteFolderUp = folder.path !== '/' && folder.path !== '/root';
    this.files = folder.files.map(f => new FileViewModel(f));
  }
}
