import {File} from '../entities/file';
import MediumModel from './medium.model';

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

export function toMedium(file: FileModel): MediumModel {
  return new MediumModel('file', {
    id: 'INVALID',
    name: file.name,
    title: file.name,
    isAvailable: true,
    duration: 0,
    isChecked: true,
    mimeType: '',
    filePath: file.filePath,
    ext: file.name.substr(file.name.lastIndexOf('.'))
  })
}
