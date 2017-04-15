import * as utils from 'util';
import {UpsertUserRequest} from '../requests/upsertUser.request';
import {ValidatorOptions} from './validatorOptions';

export default class UserValidator {
  static validateAndBuildRequest(rawRequest: any, opts?: ValidatorOptions): UpsertUserRequest {
    const safeOptions = opts || {};
    UserValidator.assertValidRequest(rawRequest, safeOptions);
    return UserValidator.buildRequest(rawRequest);
  }

  static assertAndGetUserId(rawParams: any): string {
    if (!rawParams || !rawParams.userId) {
      throw new Error('Id must be set.');
    }
    return rawParams.userId;
  }

  private static assertValidRequest(rawRequest: any, opts: ValidatorOptions) {
    if (rawRequest === undefined) {
      throw new Error('No data has been provided for user');
    }
    if (rawRequest.isActive && !utils.isBoolean(rawRequest.isActive)) {
      throw new Error('isActive must be of type Boolean');
    }
    if (rawRequest.username && !utils.isString(rawRequest.username)) {
      throw new Error('username must be of type String');
    }
    if (rawRequest.fullName && !utils.isString(rawRequest.fullName)) {
      throw new Error('username must be of type String');
    }
    if (rawRequest.email && !utils.isString(rawRequest.email)) {
      throw new Error('email must be of type String');
    }
    if (rawRequest.hashedPassword && !utils.isString(rawRequest.hashedPassword)) {
      throw new Error('hashedPassword must be of type String');
    }
  }

  private static buildRequest(rawRequest: any): UpsertUserRequest {
    let request = {} as UpsertUserRequest;

    if ('isActive' in rawRequest) request.isActive = rawRequest.isActive;
    if ('username' in rawRequest) request.username = rawRequest.username;
    if ('fullName' in rawRequest) request.fullName = rawRequest.fullName;
    if ('email' in rawRequest) request.email = rawRequest.email;
    if ('hashedPassword' in rawRequest) request.password = rawRequest.hashedPassword;

    return request;
  }
}
