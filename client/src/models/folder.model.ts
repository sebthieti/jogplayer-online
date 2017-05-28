import {Folder} from '../entities/folder';
import FileModel from './file.model';

export default class FolderModel {
  files: FileModel[];
  // canExecuteFolderUp: boolean;

  constructor(public path: string, folder?: Folder, private fileFilter?: string) {
    this.files = ((folder && this.filterAndOrderFiles(folder.files || [])) || [])
      .map(file => new FileModel(path, file));
  }

  private filterAndOrderFiles(files: File[]) { // TODO Order files?
    return this.filterFiles(files);
  }

  // TODO Think about: filter s/b business side or controller ? Shoulnd't be, because only where filter on endpoint
  private filterFiles(files) {
    return files.filter(file =>
      !file.type || file.type === 'D' || !this.fileFilter || file.name.endsWith(this.fileFilter)
    );
  }

  get parentPath(): string {
    let segments = this.path.split('/');
    if (segments.length === 1) {
      return '/';
    }
    return segments
        .slice(0, segments.length - 2)
        .join('/') + '/';
  }
}
