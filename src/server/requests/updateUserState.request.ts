import {MediumInQueue} from '../entities/mediumInQueue';

export interface UpdateUserStateRequest {
  playedPosition?: number;
  mediaQueue?: MediumInQueue[];
  browsingFolderPath?: string;
  openedPlaylistPosition?: number;
  playingMediumInQueueIndex?: number;
}
