export default class FileModel {
  name: string;
  type: string;
  files: FileModel[];

  constructor(file?: File) {
    Object.assign(this, file);
  }

  get isDirectory(): boolean {
    return this.type === 'D';
  }

  get isFile(): boolean {
    return this.type === 'F'
  }
}
