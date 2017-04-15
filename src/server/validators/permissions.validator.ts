import * as utils from 'util';
import {ValidatorOptions} from './validatorOptions';
import {UpdatePermissionsRequest} from '../requests/updatePermissions.request';

export default class PermissionsValidator {
  static validateAndBuildRequest(rawRequest: any, opts?: ValidatorOptions): UpdatePermissionsRequest {
    const safeOptions = PermissionsValidator.safeOptions(opts);
    PermissionsValidator.assertValidRequest(rawRequest, safeOptions);
    return PermissionsValidator.buildRequest(rawRequest, safeOptions);
  }

  private static buildRequest(rawRequest: any, opts: ValidatorOptions): UpdatePermissionsRequest {
    let request = {} as UpdatePermissionsRequest;

    if ('canWrite' in rawRequest) request.canWrite = rawRequest.canWrite;
    if ('isAdmin' in rawRequest) request.isAdmin = rawRequest.isAdmin;
    if ('allowPaths' in rawRequest) request.allowPaths = rawRequest.allowPaths;
    if ('denyPaths' in rawRequest) request.denyPaths = rawRequest.denyPaths;
    if ('homePath' in rawRequest) request.homePath = rawRequest.homePath;

    return request;
  }

  private static safeOptions(opts: ValidatorOptions) {
    return opts || {};
  }

  private static assertValidRequest(rawRequest: any, opts: ValidatorOptions) {
    if (rawRequest === undefined) {
      throw new Error('No data has been provided for user');
    }

    if (rawRequest.canWrite && !utils.isBoolean(rawRequest.canWrite)) {
      throw new Error('canWrite must be of type Boolean');
    }
    if (rawRequest.isAdmin && !utils.isBoolean(rawRequest.isAdmin)) {
      throw new Error('isAdmin must be of type Boolean');
    }
    if (rawRequest.homePath && !utils.isString(rawRequest.homePath)) {
      throw new Error('homePath must be of type String');
    }
    if (rawRequest.allowPaths && !utils.isArray(rawRequest.allowPaths)) {
      throw new Error('allowPaths must be of type String');
    }
    if (rawRequest.allowPaths && rawRequest.allowPaths.some(x => !utils.isString(x))) {
      throw new Error('allowPaths must contain only Strings');
    }
    if (rawRequest.denyPaths && !utils.isArray(rawRequest.denyPaths)) {
      throw new Error('allowPaths must be of type String');
    }
    if (rawRequest.denyPaths && rawRequest.denyPaths.some(x => !utils.isString(x))) {
      throw new Error('denyPaths must contain only Strings');
    }
  }
}
