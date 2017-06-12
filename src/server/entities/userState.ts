import {MediumInQueue} from './mediumInQueue';

export interface UserState {
  playedPosition: number;
  mediaQueue: MediumInQueue[];
  browsingFolderPath: string;
  openedPlaylistPosition: number;
  playingMediumInQueueIndex: number;
}
