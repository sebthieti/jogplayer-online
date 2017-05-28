import FileModel from '../models/file.model';

export class FileViewModel extends FileModel {
  selected: boolean;

  constructor(file: FileModel) {
    super(file.parentPath, {
      name: file.name,
      type: file.type
    } as File);
  }
}
