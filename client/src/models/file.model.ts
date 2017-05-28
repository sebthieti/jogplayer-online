import {File} from '../entities/file';

export default class FileModel {
  name: string;
  type: string;

  constructor(public parentPath: string, file?: File) {
    Object.assign(this, file);
  }

  get playPath() {
    // TODO Find a way to keep localhost:10000
    return `http://localhost:10000/api/media/play/path${this.filePath}`;
  }

  get filePath(): string {
    if (this.isDirectory) {
      return `${this.parentPath}/${this.name}/`;
    } else if (this.isFile) {
      return `${this.parentPath}/${this.name}`;
    }
    throw new Error('Unhandled file type');
  }

  get isDirectory(): boolean {
    return this.type === 'D';
  }

  get isFile(): boolean {
    return this.type === 'F'
  }
}
