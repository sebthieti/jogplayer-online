import * as utils from 'util';
import {UpdateUserStateRequest} from '../requests/updateUserState.request';

export default class UserStateValidator {
  static validateAndBuildRequest(rawRequest: any): UpdateUserStateRequest {
    UserStateValidator.assertValidRequest(rawRequest);
    return UserStateValidator.buildRequest(rawRequest);
  }

   private static assertValidRequest(rawRequest: any) {
    if (rawRequest === undefined) {
      throw new Error('No rawRequest has been provided for userState');
    }

    if (rawRequest.playedPosition && !utils.isNumber(rawRequest.playedPosition)) {
      throw new Error('playedPosition must be of type Number');
    }
    if (rawRequest.mediaQueue && !utils.isArray(rawRequest.mediaQueue)) {
      throw new Error('mediaQueue must be of type Array');
    }
    if (rawRequest.browsingFolderPath && !utils.isString(rawRequest.browsingFolderPath)) {
      throw new Error('browsingFolderPath must be of type String');
    }
    if (rawRequest.openedPlaylistPosition && !utils.isNumber(rawRequest.openedPlaylistPosition)) {
      throw new Error('openedPlaylistPosition must be of type String');
    }
    if (rawRequest.playingMediumInQueueIndex && !utils.isNumber(rawRequest.playingMediumInQueueIndex)) {
      throw new Error('playingMediumInQueueIndex must be of type Number');
    }
  }

  private static buildRequest(rawRequest: any): UpdateUserStateRequest {
    let request = {} as UpdateUserStateRequest;

    if ('playedPosition' in rawRequest) request.playedPosition = rawRequest.playedPosition;
    if ('mediaQueue' in rawRequest) request.mediaQueue = rawRequest.mediaQueue;
    if ('browsingFolderPath' in rawRequest) request.browsingFolderPath = rawRequest.browsingFolderPath;
    if ('openedPlaylistPosition' in rawRequest) request.openedPlaylistPosition = rawRequest.openedPlaylistPosition;
    if ('playingMediumInQueueIndex' in rawRequest) request.playingMediumInQueueIndex = rawRequest.playingMediumInQueueIndex;

    return request;
  }
}
