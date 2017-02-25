import Dto from './dto';
import UserPermissionsDto, {IUserPermissionsDto} from './userPermissions.dto';

export interface IUserDto {
  id: string;
  isActive: string;
  username: string;
  fullName: string;
  email: string;
  password: string;
  permissions: IUserPermissionsDto;
}

export default class UserDto extends Dto implements IUserDto {
  id: string;
  isActive: string;
  username: string;
  fullName: string;
  email: string;
  password: string;
  permissions: IUserPermissionsDto;

  static safeOptions(options) {
    return options || {};
  }

  static assertValidData(data, options) {
    if (data === undefined) {
      throw new Error('No data has been provided for user');
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
    if (data.isActive && typeof data.isActive !== 'boolean') {
      throw new Error('isActive must be of type Boolean');
    }
    if (data.username && typeof data.username !== 'string') {
      throw new Error('username must be of type String');
    }
    if (data.fullName && typeof data.fullName !== 'string') {
      throw new Error('username must be of type String');
    }
    if (data.email && typeof data.email !== 'string') {
      throw new Error('email must be of type String');
    }
    if (data.password && typeof data.password !== 'string') {
      throw new Error('password must be of type String');
    }
  }

  static toDto(data, options) {
    options = UserDto.safeOptions(options);
    UserDto.assertValidData(data, options);
    return new UserDto(data, options.overrideId);
  }

  constructor(data, overrideId) {
    super();

    this.id = overrideId || data.id;
    if ('isActive' in data) this.isActive = data.isActive;
    if ('username' in data) this.username = data.username;
    if ('fullName' in data) this.fullName = data.fullName;
    if ('email' in data) this.email = data.email;
    if ('password' in data) this.password = data.password;
    this.permissions = new UserPermissionsDto(data);
  }
}
