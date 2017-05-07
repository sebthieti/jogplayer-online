import {UserState} from '../entities/userState';

export class UserStateModel {
  playedPosition: number;
  mediaQueue: string[];
  browsingFolderPath: string;
  openedPlaylistId: string;
  playingMediumInQueueIndex: number;

  constructor(state?: UserState) {
    Object.assign(this, state);
  }

  async loadUserState() { // TODO Move to service
    // authBusiness
    //   .observeAuthenticatedUser()
    //   .whereHasValue()
    //   .do(function(__) {
    // const vol = this.tryLoadVolumeState() || 1.0;
    // this.audioService.setVolume(vol);
    //
    // const userState = await this.userStateRepository.getCurrentUserState();
    // initializingState = true;


    // UserStateModel
    //   .getCurrentUserStateAsync()
    //   .then(function(userState) {
    //     initializingState = true;
    //     mediators.setIsUserStateInitialized(initializingState);
    //     userStateSubject.onNext(userState);
    //     if (!userState) {
    //       initializingState = false;
    //       mediators.setIsUserStateInitialized(initializingState);
    //       return;
    //     }
    //
    //     $q.all([
    //       loadMediaQueueAsync(userState)
    //         .then(function() {
    //           return loadCurrentMediumAsync(userState);
    //         }),
    //       loadCurrentPlaylist(userState)
    //     ]).then(function() {
    //       initializingState = false;
    //       mediators.setIsUserStateInitialized(initializingState);
    //     }, function() {
    //       initializingState = false;
    //       mediators.setIsUserStateInitialized(initializingState);
    //     });
    //   });
    // })
    // .silentSubscribe();
  }

  // setPlayedPosition(position: number): UserStateModel {
  //   this.playedPosition = position;
  //   return this;
  // }
  //
  // setMediaQueue(mediaQueue: string[]): UserStateModel {
  //   this.mediaQueue = mediaQueue;
  //   return this;
  // }
  //
  // setBrowsingFolderPath(browsingFolderPath: string): UserStateModel {
  //   this.browsingFolderPath = browsingFolderPath;
  //   return this;
  // }
  //
  // setPlayingMediumInQueueIndex(mediumInQueueIndex: number): UserStateModel {
  //   this.playingMediumInQueueIndex = mediumInQueueIndex;
  //   return this;
  // }
  //
  // setOpenedPlaylistId(playlistId: string): UserStateModel {
  //   this.openedPlaylistId = playlistId;
  //   return this;
  // }
}
