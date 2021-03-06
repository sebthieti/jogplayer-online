export interface IFileInfo {
  name: string;
  type: string;
  isRoot: boolean;
  filePath: string;
  isDirectory?: boolean;
  isFile?: boolean;
  isValid?: boolean;
}

export default class FileInfo implements IFileInfo {
  static Directory = 'D';
  static File = 'F';
  static Invalid = new FileInfo({} as IFileInfo);

  name: string;
  type: string;
  isRoot: boolean;
  filePath: string;

  constructor(entity: IFileInfo) {
    this.name = entity.name;
    this.type = entity.type;
    this.isRoot = entity.isRoot;
    this.filePath = entity.filePath;
  }

  get isDirectory(): boolean {
    return this.type === FileInfo.Directory;
  }

  get isFile(): boolean {
    return this.type === FileInfo.File;
  }

  get isValid(): boolean {
    return 'name' in this &&
      'type' in this &&
      'isRoot' in this;
  }
}
