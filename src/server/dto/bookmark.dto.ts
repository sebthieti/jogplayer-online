import Dto from './dto';

export interface IBookmarkDto {
  id: string;
  name: string;
  index: string;
  filePath: string;
  createdOn: string;
  folderPath: string;
}

export default class BookmarkDto extends Dto implements IBookmarkDto {
  id: string;
  name: string;
  index: string;
  filePath: string;
  createdOn: string;
  folderPath: string;

  static toDto(data, options) {
    options = this.safeOptions(options);
    this.assertValidData(data, options);
    return new BookmarkDto(data, options.overrideId);
  }

  static safeOptions(options) {
    if (!options) return {};
    return options;
  }

  static assertValidData(data, options) {
    if (data === undefined) {
      throw new Error('Invalid Bookmark');
    }
  }

  constructor(data, overrideId) {
    super();

    this.id = overrideId || data.id;
    if ('name' in data) this.name = data.name;
    if ('index' in data) this.index = data.index;
    if ('filePath' in data) this.filePath = data.filePath;
    if ('createdOn' in data) this.createdOn = data.createdOn;
    if ('folderPath' in data) this.folderPath = data.folderPath;
  }
}
