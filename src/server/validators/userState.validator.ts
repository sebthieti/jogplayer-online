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

    if (rawRequest.playedPosition && typeof rawRequest.playedPosition !== 'number') {
      throw new Error('playedPosition must be of type Number');
    }
    if (rawRequest.mediaQueue && !(rawRequest.mediaQueue instanceof Array)) {
      throw new Error('mediaQueue must be of type Array');
    }
    if (rawRequest.browsingFolderPath && typeof rawRequest.browsingFolderPath !== 'string') {
      throw new Error('browsingFolderPath must be of type String');
    }
    if (rawRequest.openedPlaylistId && typeof rawRequest.openedPlaylistId !== 'string') {
      throw new Error('openedPlaylistId must be of type String');
    }
    if (rawRequest.playingMediumInQueueIndex && typeof rawRequest.playingMediumInQueueIndex !== 'number') {
      throw new Error('playingMediumInQueueIndex must be of type Number');
    }
  }

  private static buildRequest(rawRequest: any): UpdateUserStateRequest {
    let request = {} as UpdateUserStateRequest;

    if ('playedPosition' in rawRequest) request.playedPosition = rawRequest.playedPosition;
    if ('mediaQueue' in rawRequest) request.mediaQueue = rawRequest.mediaQueue;
    if ('browsingFolderPath' in rawRequest) request.browsingFolderPath = rawRequest.browsingFolderPath;
    if ('openedPlaylistId' in rawRequest) request.openedPlaylistId = rawRequest.openedPlaylistId;
    if ('playingMediumInQueueIndex' in rawRequest) request.playingMediumInQueueIndex = rawRequest.playingMediumInQueueIndex;

    return request;
  }
}
