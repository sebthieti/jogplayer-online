import * as _ from 'lodash';
import {UpdateUserState, UserState} from '../entities/userState';
import {MediumInQueue} from '../entities/mediumInQueue';

interface UserStateModelSnapshot {
  playedPosition?: number;
  mediaQueue?: MediumInQueue[];
  browsingFolderPath?: string;
  openedPlaylistPosition?: number;
  playingMediumInQueueIndex?: number;
}

export class UserStateModel {
  playedPosition: number;
  mediaQueue: MediumInQueue[];
  browsingFolderPath: string;
  openedPlaylistPosition: number;
  playingMediumInQueueIndex: number;

  private previousSnapshot: UserStateModelSnapshot;

  constructor(state?: UserState) {
    this.setFromEntity(state);
  }

  setFromEntity(state?: UserState): UserStateModel {
    state && Object.assign(this, {
      playedPosition: state.playedPosition,
      mediaQueue: state.mediaQueue,
      browsingFolderPath: state.browsingFolderPath,
      openedPlaylistPosition: state.openedPlaylistPosition,
      playingMediumInQueueIndex: state.playingMediumInQueueIndex
    });

    this.takeSnapshot();

    return this;
  }

  private takeSnapshot(): void {
    this.previousSnapshot = {
      playedPosition: this.playedPosition,
      mediaQueue: this.mediaQueue,
      browsingFolderPath: this.browsingFolderPath,
      openedPlaylistPosition: this.openedPlaylistPosition,
      playingMediumInQueueIndex: this.playingMediumInQueueIndex
    };
  }

  toUpdateUserStateRequest(): UpdateUserState {
    let update = {} as UpdateUserState;

    if (this.playedPosition && this.playedPosition !== this.previousSnapshot.playedPosition) {
      update.playedPosition = this.playedPosition;
    }
    if (this.mediaQueue && !_.isEqual(this.mediaQueue, this.previousSnapshot.mediaQueue)) {
      update.mediaQueue = this.mediaQueue;
    }
    if (this.browsingFolderPath && this.browsingFolderPath !== this.previousSnapshot.browsingFolderPath) {
      update.browsingFolderPath = this.browsingFolderPath;
    }
    if (this.openedPlaylistPosition !== undefined && this.openedPlaylistPosition !== this.previousSnapshot.openedPlaylistPosition) {
      update.openedPlaylistPosition = this.openedPlaylistPosition;
    }
    if (this.playingMediumInQueueIndex && this.playingMediumInQueueIndex !== this.previousSnapshot.playingMediumInQueueIndex) {
      update.playingMediumInQueueIndex = this.playingMediumInQueueIndex;
    }

    return update;
  }
}
