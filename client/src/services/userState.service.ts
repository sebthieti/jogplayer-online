import {autoinject} from 'aurelia-framework';
import { BehaviorSubject, Observable } from 'rx';
import {UserStateModel} from '../models/userState.model';
import AudioService from './audio.service';
import AuthenticationService from './authentication.service';
import MediaQueueService from './mediaQueue.service';
import UserStateRepository from '../repositories/userState.repository';
import PlaylistService from './playlist.service';
import {FileExplorerService} from './fileExplorer.service';
import Mediators from '../mediators';
import {UserState} from '../entities/userState';
import PlaylistRepository from '../repositories/playlist.repository';
import MediumModel from '../models/medium.model';
import {FileExplorerRepository} from '../repositories/fileExplorer.repository';
import MediaService from './media.service';

interface ControlsState {
  playedPosition: number,
  currentPlaylistVm: any,
  currentFileExplorerPath: string,
  mediaQueueLinks: string[],
  openedPlaylistPosition: number,
  playingMediumInQueueIndex: number
}

@autoinject
export default class UserStateService {
  userStateSubject = new BehaviorSubject<UserStateModel>(null);
  initializingState = false;

  constructor(
    private userStateRepository: UserStateRepository,
    private audioService: AudioService,
    private authenticationService: AuthenticationService,
    private mediaQueueService: MediaQueueService,
    private mediaService: MediaService,
    private fileExplorerService: FileExplorerService,
    private playlistService: PlaylistService,
    private playlistRepository: PlaylistRepository,
    private fileExplorerRepository: FileExplorerRepository,
    private mediators: Mediators
  ) { }

  async init() {
    await this.loadUserState();
    this.onControlsStateChangeUpdate();
  }

  async loadUserState(): Promise<void> {
    const vol = this.tryLoadVolumeState() || 1.0;
    this.audioService.setVolume(vol);

    const userState = await this.userStateRepository.getCurrentUserState();
    const userStateModel = new UserStateModel(userState);
    this.initializingState = true;
    this.mediators.setIsUserStateInitialized(this.initializingState);
    this.userStateSubject.onNext(userStateModel);

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
    const mediaInQueuePromises = (userState.mediaQueue || []).map(mediumFilePath => {
      if (mediumFilePath.startsWith('/api/playlists/')) {
        // return new PlaylistMediaModel(
        //   this.playlistRepository,
        //   this.fileExplorerRepository,
        //   this.mediaQueueService
        // )
        // .getMediumFromFilePath(mediumFilePath);
      } else {
        // TODO In DB, userState.mediumLinks => url and origin. For now, only file
        return this.mediaService.setMediaFromFilePath(
          new MediumModel('file'),
          mediumFilePath);
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

  async updateStateAsync(userState: UserStateModel): Promise<UserStateModel> {
    const updateRequest = userState.toUpdateUserStateRequest();
    const updatedState = await this.userStateRepository.updateUserState(updateRequest);
    userState.setFromEntity(updatedState);

    return userState;
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
    this.playlistService.selectPlaylistByIndexAsync(userState.openedPlaylistPosition);
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
      (mediumPosition, openedPlaylistPosition, currentFileExplorerPath, mediumQueueLinks, playingMediumInQueueIndex) => {
        return {
          playedPosition: mediumPosition,
          openedPlaylistPosition: openedPlaylistPosition,
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
        controlsState.openedPlaylistPosition === null &&
        controlsState.currentFileExplorerPath === null &&
        controlsState.mediaQueueLinks === null &&
        controlsState.playingMediumInQueueIndex === null)
      )
      .do(async controlsState => {
        const userState = this.observeUserState().getValue();
        if (userState) { // Just update
          userState.playedPosition = controlsState.playedPosition;
          userState.mediaQueue = controlsState.mediaQueueLinks;
          userState.playingMediumInQueueIndex = controlsState.playingMediumInQueueIndex;
          userState.openedPlaylistPosition = controlsState.openedPlaylistPosition;
          userState.browsingFolderPath = controlsState.currentFileExplorerPath && controlsState.currentFileExplorerPath.path;
          // const updatedState = await userState.updateAsync();
          const updatedState = await this.updateStateAsync(userState);
          this.userStateSubject.onNext(updatedState);
        } else { // Insertion
          this.addAsync(controlsState);

          this.userStateSubject.onNext(userState);
          // TODO PB 2 calls are made: 1 for add, other for update
        }
      })
      .subscribe();
  }

  private addAsync(controlsState: ControlsState) {
    return this.userStateRepository.updateUserState({
      mediaQueue: controlsState.mediaQueueLinks,
      playedPosition: controlsState.playedPosition,
      browsingFolderPath: controlsState.currentFileExplorerPath,
      playingMediumInQueueIndex: controlsState.playingMediumInQueueIndex,
      openedPlaylistPosition: controlsState.openedPlaylistPosition
    });
  }

  observeMediumQueueSelectLinkUrl() {
    return this.mediaQueueService
      .observeMediaQueue()
      .mapWithPreviousValue((oldValue, newValue) => {
        return { oldValue: oldValue, newValue: newValue }
      })
      .filter(values =>
        !((values.oldValue === null) && (values.newValue === null))
      )
      .filter(values =>
        !(!(values.oldValue && values.oldValue.length > 0) && !(values.newValue && values.newValue.length > 0)) // TODO Revamp
      )
      .map(values => values.newValue)
      .filter(x => !!x)
      .map(mediaQueue => mediaQueue.map(mediumInQueue => {
        return mediumInQueue.selfPath || mediumInQueue.filePath;
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
        this.fileExplorerService.observeMainExplorerContent(),
        (t, m) => m
      )
      .distinctUntilChanged(x => x);
  }

  observePlaylistSelectionChangeByInterval(interval) {
    return Observable
      .timer(interval, interval)
      .withLatestFrom(
        this.playlistService.observeOpenedPlaylistPosition(),
        (t, m) => m
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
