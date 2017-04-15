import {UpdatePermissionsRequest} from '../requests/updatePermissions.request';

export default class UserPermissionsValidator {
  static validateAndBuildRequest(rawRequest: any): UpdatePermissionsRequest {
    UserPermissionsValidator.assertValidRequest(rawRequest);
    return UserPermissionsValidator.buildRequest(rawRequest);
  }

  static assertValidRequest(rawRequest: any) {
    if (rawRequest === undefined) {
      throw new Error('No rawRequest has been provided for userPermissions');
    }

    if (rawRequest.isAdmin && typeof rawRequest.isAdmin !== 'boolean') {
      throw new Error('isAdmin must be of type Boolean');
    }
    if (rawRequest.canWrite && typeof rawRequest.canWrite !== 'boolean') {
      throw new Error('canWrite must be of type Boolean');
    }
    if (rawRequest.allowPaths && !(rawRequest.allowPaths instanceof Array)) {
      throw new Error('allowPaths must be of type Array');
    }
    if (rawRequest.denyPaths && !(rawRequest.denyPaths instanceof Array)) {
      throw new Error('denyPaths must be of type Array');
    }
    if (rawRequest.homePath && typeof rawRequest.homePath !== 'string') {
      throw new Error('homePath must be specified and of type String');
    }
  }

  private static buildRequest(rawRequest: any): UpdatePermissionsRequest {
    let request = {} as UpdatePermissionsRequest;

    if ('isAdmin' in rawRequest) request.isAdmin = rawRequest.isAdmin;
    if ('canWrite' in rawRequest) request.canWrite = rawRequest.canWrite;
    if ('allowPaths' in rawRequest) request.allowPaths = rawRequest.allowPaths;
    if ('denyPaths' in rawRequest) request.denyPaths = rawRequest.denyPaths;
    if ('homePath' in rawRequest) request.homePath = rawRequest.homePath;

    return request;
  }
}
