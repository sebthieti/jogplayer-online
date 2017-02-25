import Dto from './dto';

export interface IFavoriteDto {
  id: string;
  name: string;
  createdOn: string;
  index: string;
  folderPath: string;
}

export default class FavoriteDto extends Dto implements IFavoriteDto {
  id: string;
  name: string;
  createdOn: string;
  index: string;
  folderPath: string;

  static toDto(data, options) {
    options = FavoriteDto.safeOptions(options);

    FavoriteDto.assertValidData(data, options);
    return new FavoriteDto(data, options.overrideId);
  }

  static safeOptions(options) {
    if (!options) return {};
    options.overrideId = options.overrideId || null;
    options.checkAllRequiredFields = options.checkAllRequiredFields || false;
    options.checkAllRequiredFieldsButId = options.checkAllRequiredFieldsButId || false;
    return options;
  }

  static assertValidData(data, options) {
    if (data === undefined) {
      throw new Error('No data has been provided for favorite');
    }
    if (options.checkAllRequiredFields && !data.id && !options.overrideId) {
      throw new Error('If data does not contain an Id, you have to use overrideId');
    }
    if (options.checkAllRequiredFields && options.overrideId && typeof options.overrideId !== 'string') {
      throw new Error('Overrode id is not of type String');
    }
    if (options.checkAllRequiredFields && !options.overrideId && typeof data.id !== 'string') {
      throw new Error('Id must be defined and of type String');
    }
    if ((data.id && data.id.length > 24) || (options.overrideId && options.overrideId.length > 24)) {
      throw new Error('Overrode id is not of type String');
    }
    if (options.checkAllRequiredFields || options.checkAllRequiredFieldsButId && typeof data.name !== 'string') {
      throw new Error('Name must be specified and of type String');
    }
    if (data.createdOn && !(data.createdOn instanceof Date)) {
      throw new Error('CreatedOn must be of type Date');
    }
    if (data.index && typeof data.index !== 'number') {
      throw new Error('Specified index must be of type Number');
    }
    if (options.checkAllRequiredFields || options.checkAllRequiredFieldsButId && typeof data.folderPath !== 'string') {
      throw new Error('folderPath must be specified and of type String');
    }
  }

  constructor(data, overrideId) {
    super();

    this.id = overrideId || data.id;
    if ('name' in data) this.name = data.name;
    if ('createdOn' in data) this.createdOn = data.createdOn;
    if ('index' in data) this.index = data.index;
    if ('folderPath' in data) this.folderPath = data.folderPath;
  }
}
