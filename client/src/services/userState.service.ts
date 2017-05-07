import {autoinject} from 'aurelia-framework';
import { BehaviorSubject, Observable } from 'rx';
import {UserStateModel} from '../models/userState.model';
import AudioService from './audio.service';
import AuthenticationService from './authentication.service';
import MediaQueueService from './mediaQueue.service';
import UserStateRepository from '../repositories/userState.repository';
import PlaylistService from './playlist.service';
import FileExplorerService from './fileExplorer.service';
import Mediators from '../mediators';
import {UserState} from '../entities/userState';
import PlaylistMediaModel from '../models/playlistMedia.model';
import PlaylistRepository from '../repositories/playlist.repository';
import MediumModel from '../models/medium.model';
import {FileExplorerRepository} from '../repositories/fileExplorer.repository';

interface ControlsState {
  playedPosition: number,
  currentPlaylistVm: any,
  currentFileExplorerPath: string,
  mediaQueueLinks: string[],
  playingMediumInQueueIndex: number
}

@autoinject
export default class UserStateService {
  userStateSubject = new BehaviorSubject<UserStateModel>();
  //var PlayerState = Jpo.PlayerState;
  initializingState = false;

  constructor(
    private userStateRepository: UserStateRepository,
    private audioService: AudioService,
    private authenticationService: AuthenticationService,
    private mediaQueueService: MediaQueueService,
    private fileExplorerService: FileExplorerService,
    private playlistService: PlaylistService,
    private playlistRepository: PlaylistRepository,
    private fileExplorerRepository: FileExplorerRepository,
    private mediators: Mediators
  ) { }

  async loadUserState(): Promise<void> {
    const vol = this.tryLoadVolumeState() || 1.0;
    this.audioService.setVolume(vol);

    const userState = await this.userStateRepository.getCurrentUserState();
    this.initializingState = true;
    this.mediators.setIsUserStateInitialized(this.initializingState);
    this.userStateSubject.onNext(userState);

    if (!userState) {
      this.initializingState = false;
      this.mediators.setIsUserStateInitialized(this.initializingState);
      return;
    }

    try {
      await Promise.all([
        this.loadMediaQueueAndCurrentMedium(userState),
        this.loadCurrentPlaylist(userState)
      ]);

      this.initializingState = false;
      this.mediators.setIsUserStateInitialized(this.initializingState);
    } catch (e) {
      this.initializingState = false;
      this.mediators.setIsUserStateInitialized(this.initializingState);
    }
  }

  private async loadMediaQueueAndCurrentMedium(userState: UserState) {
    await this.loadMediaQueueAsync(userState);
    return this.loadCurrentMediumAsync(userState);
  }

  private async loadMediaQueueAsync(userState: UserState): Promise<void> {
    const mediaInQueuePromises = (userState.mediaQueue || []).map(mediumLinkUrl => {
      if (mediumLinkUrl.startsWith('/api/playlists/')) {
        return new PlaylistMediaModel(
          this.playlistRepository,
          this.fileExplorerRepository,
          this.mediaQueueService
        )
        .getMediumFromUrl(mediumLinkUrl);
      } else {
        return new MediumModel(this.fileExplorerRepository, this.mediaQueueService)
          .setFromUrl(mediumLinkUrl);
        // return FileModel
        //   .getMediumFromLinkUrl(mediumLinkUrl)
        //   .catch(function(err) {
        //     // TODO In the future enhance error handling
        //     return FileModel.createEntity(mediumLinkUrl);
        //   });
      }
    });

    try {
      const mediaInQueue = await Promise.all(mediaInQueuePromises);
      // Si un medium fail, ne laisser que le nom
      this.mediaQueueService.enqueueMediaAndStartQueue(mediaInQueue);
    } catch (err) {
      console.log(err);
    }
  }

  private async loadCurrentMediumAsync(userState: UserState) {
    // Search medium at index
    const mediumInQueue = await this.mediaQueueService.getMediumAtIndexAsync(
      userState.playingMediumInQueueIndex
    );
    if (mediumInQueue) {
      // TODO Move the following to audioService ?
      await this.audioService.setMediumToPlayAsync(mediumInQueue);
      this.audioService.setMediumPositionByTime(userState.playedPosition);
      //audioService.playOrPause();
    }
  }

  private tryLoadVolumeState(): number {
    if (typeof(Storage) !== "undefined") {
      // Code for localStorage/sessionStorage.
      const state = JSON.parse(localStorage.getItem('state'));
      return state && state.volume || 0;
    }
  }

  private tryStoreVolumeState(volume: number): void {
    if(typeof(Storage) !== "undefined") {
      // Code for localStorage/sessionStorage.
      localStorage.setItem('state', JSON.stringify({ volume: volume }));
    }
  }

  loadCurrentPlaylist(userState: UserState): void {
    this.playlistService.selectPlaylistByIndexAsync(userState.openedPlaylistIndex);
  }

  observeUserState() {
    return this.userStateSubject;
  }

  observeControlsForStateChange() {
    return Observable.combineLatest(
      this.observeMediumPositionChangeByInterval(5000)
        .startWith(null).map(x => x),
      this.observePlaylistSelectionChangeByInterval(5000)
        .startWith(null).map(x => x),
      this.observeFileExplorerPathChangeByInterval(5000)
        .startWith(null).map(x => x),
      this.observeMediumQueueSelectLinkUrl()
        .startWith(null).map(x => x),
      this.observeCurrentMediumIndexInQueue()
        .startWith(null).map(x => x),
      (mediumPosition, currentPlaylistVm, currentFileExplorerPath, mediumQueueLinks, playingMediumInQueueIndex) => {
        return {
          playedPosition: mediumPosition,
          currentPlaylistVm: currentPlaylistVm,
          currentFileExplorerPath: currentFileExplorerPath,
          mediaQueueLinks: mediumQueueLinks,
          playingMediumInQueueIndex: playingMediumInQueueIndex
        }
      }
    )
    .filter(() => !this.initializingState);
  }

  onControlsStateChangeUpdate() {
    this.observeMediaVolumeChange()
      .do(vol => this.tryStoreVolumeState(vol))
      .subscribe();

    this.observeControlsForStateChange()
      .where(controlsState =>
        !(controlsState.playedPosition === null &&
        controlsState.currentPlaylistVm === null &&
        controlsState.currentFileExplorerPath === null &&
        controlsState.mediaQueueLinks === null &&
        controlsState.playingMediumInQueueIndex === null)
      )
      .do(controlsState => {
        const userState = this.observeUserState().getValue();
        const plId = controlsState.currentPlaylistVm
          ? controlsState.currentPlaylistVm.model.id
          : null;

          if (userState) { // Just update
            userState.playedPosition = controlsState.playedPosition;
            userState.mediaQueue = controlsState.mediaQueueLinks;
            userState.playingMediumInQueueIndex = controlsState.playingMediumInQueueIndex;
            userState.openedPlaylistId = plId;
            userState.browsingFolderPath = controlsState.currentFileExplorerPath;
            userState
              .updateAsync()
              .then(function(updatedState) {
                this.userStateSubject.onNext(updatedState);
              });
          } else { // Insertion
            this.addAsync(controlsState);

            this.userStateSubject.onNext(userState);
            // TODO PB 2 calls are made: 1 for add, other for update
          }
      })
      .subscribe();
  }

  private addAsync(controlsState: ControlsState) {
    const plId = controlsState.currentPlaylistVm
      ? controlsState.currentPlaylistVm.model.id
      : null;

    return this.userStateRepository.updateUserState({
      mediaQueue: controlsState.mediaQueueLinks,
      playedPosition: controlsState.playedPosition,
      browsingFolderPath: controlsState.currentFileExplorerPath,
      playingMediumInQueueIndex: controlsState.playingMediumInQueueIndex,
      openedPlaylistIndex: plId
    });
  }

  observeMediumQueueSelectLinkUrl() {
    return this.mediaQueueService
      .observeMediaQueue()
      .selectWithPreviousValue((oldValue, newValue) => {
        return { oldValue: oldValue, newValue: newValue }
      })
      .filter(values =>
        !((values.oldValue === null) && (values.newValue === null)) &&
        !(!values.oldValue.some() && !values.newValue.some()) // TODO Revamp
      )
      .map(values => values.newValue)
      .map(mediaQueue => mediaQueue.map(mediumInQueue => {
        return mediumInQueue.model.selectSelfFromLinks();
      }));
  }

  observeMediumPositionChangeByInterval(interval) {
    return Observable
      .timer(interval, interval)
      .withLatestFrom(
        this.audioService
          .observeTimeUpdate()
          .select((value) => value.currentTime),
        (t, m) => m
      )
      .distinctUntilChanged(x => x);
  }

  observeFileExplorerPathChangeByInterval(interval) {
    return Observable
      .timer(interval, interval)
      .withLatestFrom(
        this.fileExplorerService.observeCurrentFolderContent(),
        (t, m) => m
      )
      .distinctUntilChanged(x => x);
  }

  observePlaylistSelectionChangeByInterval(interval) {
    return Observable
      .timer(interval, interval)
      .withLatestFrom(
        this.playlistService.observeCurrentPlaylist(),
        function(t, m) { return m }
      )
      .distinctUntilChanged(x => x);
  }

  observeCurrentMediumIndexInQueue() {
    return this.mediaQueueService.observeCurrentMediumIndexInQueue();
  }

  observeMediaVolumeChange() {
    return this.audioService
      .observeVolume()
      .debounce(500);
  }
}
