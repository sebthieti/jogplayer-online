import * as utils from "util";
import {ValidatorOptions} from "./validatorOptions";
import {UpsertFavoriteRequest} from '../requests/upsertFavorite.request';

export default class FavoriteValidator {
  static assertAndGetFavoriteIndex(rawParams: any): number {
    if (!rawParams || !rawParams.favIndex) {
      throw new Error('Index must be set.');
    }
    if (utils.isNumber(rawParams.favIndex)) {
      throw new Error('Index must be a number.');
    }
    return +rawParams.favIndex;
  }

  static validateAndBuildRequest(rawRequest: any, options?: ValidatorOptions): UpsertFavoriteRequest {
    const safeOptions = FavoriteValidator.safeOptions(options);
    FavoriteValidator.assertValidRequest(rawRequest, safeOptions);
    return FavoriteValidator.buildRequest(rawRequest);
  }

  private static safeOptions(opts: ValidatorOptions): ValidatorOptions {
    if (!opts) return {};
    opts.checkAllRequiredFields = opts.checkAllRequiredFields || false;
    opts.checkAllRequiredFieldsButId = opts.checkAllRequiredFieldsButId || false;
    return opts;
  }

  private static assertValidRequest(rawRequest: any, opts: ValidatorOptions) {
    if (rawRequest === undefined) {
      throw new Error('No data has been provided for favorite');
    }
    if (opts.checkAllRequiredFields || opts.checkAllRequiredFieldsButId && !utils.isString(rawRequest.name)) {
      throw new Error('Name must be specified and of type String');
    }
    if (opts.checkAllRequiredFields || opts.checkAllRequiredFieldsButId && !utils.isString(rawRequest.folderPath)) {
      throw new Error('folderPath must be specified and of type String');
    }
  }

  private static buildRequest(rawRequest: any): UpsertFavoriteRequest {
    let request = {} as UpsertFavoriteRequest;

    if ('name' in rawRequest) request.name = rawRequest.name;
    if ('folderPath' in rawRequest) request.folderPath = rawRequest.folderPath;

    return request;
  }
}
