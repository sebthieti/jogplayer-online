import Dto from './dto';

export interface IUserPermissionsDto {
  isAdmin: boolean;
  canWrite: boolean;
  allowPaths: string[];
  denyPaths: string[];
  homePath: string;
}

export default class UserPermissionsDto extends Dto implements IUserPermissionsDto {
  isAdmin: boolean;
  canWrite: boolean;
  allowPaths: string[];
  denyPaths: string[];
  homePath: string;

  static toDto(data) {
    UserPermissionsDto.assertValidData(data);
    return new UserPermissionsDto(data);
  }

  static assertValidData(data) {
    if (data === undefined) {
      throw new Error('No data has been provided for userPermissions');
    }

    if (data.isAdmin && typeof data.isAdmin !== 'boolean') {
      throw new Error('isAdmin must be of type Boolean');
    }
    if (data.canWrite && typeof data.canWrite !== 'boolean') {
      throw new Error('canWrite must be of type Boolean');
    }
    if (data.allowPaths && !(data.allowPaths instanceof Array)) {
      throw new Error('allowPaths must be of type Array');
    }
    if (data.denyPaths && !(data.denyPaths instanceof Array)) {
      throw new Error('denyPaths must be of type Array');
    }
    if (data.homePath && typeof data.homePath !== 'string') {
      throw new Error('homePath must be specified and of type String');
    }
  }

  constructor(data) {
    super();

    if ('isAdmin' in data) this.isAdmin = data.isAdmin;
    if ('canWrite' in data) this.canWrite = data.canWrite;
    if ('allowPaths' in data) this.allowPaths = data.allowPaths;
    if ('denyPaths' in data) this.denyPaths = data.denyPaths;
    if ('homePath' in data) this.homePath = data.homePath;
  }
}
