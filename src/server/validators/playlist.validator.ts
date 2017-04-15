import {ValidatorOptions} from './validatorOptions';
import {UpsertPlaylistRequest} from '../requests/updatePlaylist.request';
import {MoveMediaRequest} from '../requests/moveMedia.request';
import {InsertMediaRequest} from '../requests/insertMedia.request';

export default class PlaylistValidator {
  static getIndex(rawParams: any): number {
      if (!rawParams || !rawParams.playlistIndex) {
        return;
      }
      return +rawParams.playlistIndex;
  }

  static assertAndGetPlaylistIdsAndSteps(rawRequest: any): MoveMediaRequest {
    const playlistIds = rawRequest.ids;
    const steps = rawRequest.steps;

    if (!playlistIds || !steps) {
      throw new Error('ids or steps have not been providen.');
    }
    return {playlistIds: playlistIds, steps: +steps};
  }

  static assertAndGetPlaylistIdAndMediaId(obj): {playlistIndex: number, mediumId: string} {
    if (!obj.playlistIndex || !obj.mediumId) {
      throw new Error('playlistIndex or mediumId have not been provided.');
    }
    return {playlistIndex: +obj.playlistIndex, mediumId: obj.mediumId};
  }

  static assertMediumInsertParamsFromRequest(request): InsertMediaRequest {
    // TODO For all assertion enforce each type (ex mediaFilePath must be string not array of string)
    const playlistIndex = request.params.playlistIndex;
    const insertPosition = request.body.index;
    const mediaFilePath = request.body.mediaFilePath;

    if (!playlistIndex || !mediaFilePath) {
      throw new Error('Playlist object does not have all mandatory fields.');
    }

    const data = {
      playlistIndex: playlistIndex,
      mediaFilePath: mediaFilePath,
    } as InsertMediaRequest;

    if (insertPosition === undefined) {
      return data;
    }

    if (!isNaN(insertPosition)) {
      const index = parseInt(insertPosition); // TODO Refac this, and upper too
      data.insertPosition = index;
    } else {
      throw new Error('insertPosition is not in a valid range.');
    }

    return data;
  }

  static validateAndBuildRequest(rawRequest: any, opts?: ValidatorOptions): UpsertPlaylistRequest {
    const safeOptions = PlaylistValidator.safeOptions(opts);
    PlaylistValidator.assertValidData(rawRequest, safeOptions);
    // TODO filePath: When i create a new phys. pl, POST send Dto with filePath
    return PlaylistValidator.buildRequest(rawRequest, safeOptions.overrideId);
  }

  static safeOptions(options: ValidatorOptions) {
    if (!options) return {};
    options.overrideId = options.overrideId || null;
    options.checkAllRequiredFields = options.checkAllRequiredFields || false;
    options.checkAllRequiredFieldsButId = options.checkAllRequiredFieldsButId || false;
    return options;
  }

  static assertValidData(rawRequest: any, opts: ValidatorOptions) {
    if (rawRequest === undefined) {
      throw new Error('Invalid Playlist');
    }

    if (opts.checkAllRequiredFields && !rawRequest.id && !opts.overrideId) {
      throw new Error('If rawRequest does not contain an Id, you have to use overrideId');
    }
    if (opts.checkAllRequiredFields && opts.overrideId && typeof opts.overrideId !== 'string') {
      throw new Error('Overrode id is not of type String');
    }
    if (opts.checkAllRequiredFields && !opts.overrideId && typeof rawRequest.id !== 'string') {
      throw new Error('Id must be defined and of type String');
    }
    if ((rawRequest.id && rawRequest.id.length > 24) || (opts.overrideId && opts.overrideId.length > 24)) {
      throw new Error('Overrode id is not of type String');
    }
    if (rawRequest.name && typeof rawRequest.name !== 'string') {
      throw new Error('Name must be of type String');
    }
    if (rawRequest.filePath && typeof rawRequest.filePath !== 'string') {
      throw new Error('filePath must be specified and of type String');
    }
    if (rawRequest.media && !(rawRequest.media instanceof Array)) {
      throw new Error('media must be specified and of type Array');
    }
  }

  private static buildRequest(rawRequest: any, overrideId: string): UpsertPlaylistRequest {
    let request = {} as UpsertPlaylistRequest;

    if ('name' in rawRequest) request.name = rawRequest.name;
    if ('filePath' in rawRequest) request.filePath = rawRequest.filePath;
    if ('media' in rawRequest) request.mediaIds = rawRequest.media; // TODO Double check this one

    return request;
  }
}
