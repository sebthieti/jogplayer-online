import Dto from './dto';

export interface IPlaylistDto {
  id: string;
  name: string;
  createdOn: string;
  updatedOn: string;
  index: string;
  filePath: string;
  isAvailable: string;
  media: any[];
}

export default class PlaylistDto extends Dto implements IPlaylistDto {
  id: string;
  name: string;
  createdOn: string;
  updatedOn: string;
  index: string;
  filePath: string;
  isAvailable: string;
  media: any[];

  static toDto(data, options) {
    options = PlaylistDto.safeOptions(options);
    PlaylistDto.assertValidData(data, options);
    // TODO filePath: When i create a new phys. pl, POST send Dto with filePath
    return new PlaylistDto(data, options.overrideId);
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
      throw new Error('Invalid Playlist');
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
    if (data.name && typeof data.name !== 'string') {
      throw new Error('Name must be of type String');
    }
    if (data.createdOn && !(data.createdOn instanceof Date)) {
      throw new Error('CreatedOn must be of type Date');
    }
    if (data.updatedOn && !(data.updatedOn instanceof Date)) {
      throw new Error('UpdatedOn must be of type Date');
    }
    if (data.index && typeof data.index !== 'number') {
      throw new Error('Specified index must be of type Number');
    }
    if (data.filePath && typeof data.filePath !== 'string') {
      throw new Error('filePath must be specified and of type String');
    }
    if (data.isAvailable && typeof data.isAvailable !== 'boolean') {
      throw new Error('isAvailable must be specified and of type Boolean');
    }
    if (data.media && !(data.media instanceof Array)) {
      throw new Error('media must be specified and of type Array');
    }
  }

  constructor(data, overrideId) {
    super();

    this.id = overrideId || data.id;
    if ('name' in data) this.name = data.name;
    if ('createdOn' in data) this.createdOn = data.createdOn;
    if ('updatedOn' in data) this.updatedOn = data.updatedOn;
    if ('index' in data) this.index = data.index;
    if ('filePath' in data) this.filePath = data.filePath;
    if ('isAvailable' in data) this.isAvailable = data.isAvailable;
    if ('media' in data) this.media = data.media;
  }

  isVirtual() {
    return !this.filePath || this.filePath == null;
  }

  getDefinedFields() {
    var fields = Dto.prototype.getDefinedFields.call(this);
    // media in playlistDto will cause error on save, so remove it
    delete fields['media'];
    return fields;
  }
}
