'use strict';

var Q = require('q'),
  Dto = require('./dto');

function assertValidData(data) {
  if (data === undefined) {
    throw new Error('No data has been provided for userState');
  }

  if (data.playedPosition && typeof data.playedPosition !== 'number') {
    throw new Error('playedPosition must be of type Number');
  }
  if (data.mediaQueue && !(data.mediaQueue instanceof Array)) {
    throw new Error('mediaQueue must be of type Array');
  }
  if (data.browsingFolderPath && typeof data.browsingFolderPath !== 'string') {
    throw new Error('browsingFolderPath must be of type String');
  }
  if (data.openedPlaylistId && typeof data.openedPlaylistId !== 'String') {
    throw new Error('openedPlaylistId must be of type String');
  }
  if (data.playingMediumInQueueIndex && typeof data.playingMediumInQueueIndex !== 'number') {
    throw new Error('playingMediumInQueueIndex must be of type Number');
  }
}

function UserStateDto(data) {
  if ('playedPosition' in data) this.playedPosition = data.playedPosition;
  if ('mediaQueue' in data) this.mediaQueue = data.mediaQueue;
  if ('browsingFolderPath' in data) this.browsingFolderPath = data.browsingFolderPath;
  if ('openedPlaylistId' in data) this.openedPlaylistId = data.openedPlaylistId;
  if ('playingMediumInQueueIndex' in data) this.playingMediumInQueueIndex = data.playingMediumInQueueIndex;
}

UserStateDto.prototype = Object.create(Dto.prototype);
UserStateDto.prototype.constructor = Dto;

UserStateDto.toDto = function (data) {
  assertValidData(data);
  return new UserStateDto(data);
};

module.exports = UserStateDto;
