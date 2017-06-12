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
import MediumInQueueModel from '../models/mediumInQueue.model';

interface ControlsState {
  playedPosition: number,
  // currentPlaylistVm: any,
  currentFileExplorerPath: string,
  mediaQueue: MediumInQueueModel[],
  openedPlaylistPosition: number,
  playingMediumInQueueIndex: number
}

@autoinject
export default class UserStateService {
  // userState = new BehaviorSubject<UserStateModel>(null);
  userState: UserStateModel = null;
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
    this.userState = userStateModel;

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
    const mediaInQueuePromises = (userState.mediaQueue || []).map(mediumInQueue => {
      return this.mediaService.setMediaFromFilePath(
        new MediumModel(mediumInQueue.playlistLink ? 'playlist' : 'file'),
        mediumInQueue.mediumPath);
    });

    try {
      const mediaInQueue = await Promise.all(mediaInQueuePromises);
      // Si un medium fail, ne laisser que le nom
      this.mediaQueueService.enqueueMediaAndStartQueue(mediaInQueue);
    } catch (err) {
      console.log(err);
    }
  }

  private async loadCurrentMediumAsync(userState: UserState): Promise<void> {
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
    this.playlistService.selectPlaylistByIndexAsync(userState.openedPlaylistPosition);
  }

  observeControlsForStateChange(): Observable<ControlsState> {
    return Observable.combineLatest(
      this.observeMediumPositionChangeByInterval(5000)
        .startWith(null).map(x => x),
      this.observeOpenedPlaylistByInterval(5000)
        .startWith(-1).map(x => x),
      this.observeFileExplorerPathByInterval(5000)
        .startWith('').map(x => x),
      this.observeMediumQueue()
        .startWith([]).map(x => x),
      this.observeCurrentMediumIndexInQueue()
        .startWith(-1).map(x => x),
      (
        mediumPosition: number,
        openedPlaylistPosition: number,
        currentFileExplorerPath: string,
        mediumQueue,
        playingMediumInQueueIndex: number
      ) => {
        return {
          playedPosition: mediumPosition,
          openedPlaylistPosition: openedPlaylistPosition,
          currentFileExplorerPath: currentFileExplorerPath,
          mediaQueue: mediumQueue,
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
        controlsState.openedPlaylistPosition === -1 &&
        controlsState.currentFileExplorerPath === null &&
        controlsState.mediaQueue === null &&
        controlsState.playingMediumInQueueIndex === -1)
      )
      .do(async controlsState => {
        if (this.userState) { // Just update
          this.userState.playedPosition = controlsState.playedPosition;
          this.userState.mediaQueue = controlsState.mediaQueue.map(mq => mq.toEntity());
          this.userState.playingMediumInQueueIndex = controlsState.playingMediumInQueueIndex;
          this.userState.openedPlaylistPosition = controlsState.openedPlaylistPosition;
          this.userState.browsingFolderPath = controlsState.currentFileExplorerPath;
          this.userState = await this.updateAsync(this.userState);
        } else { // Insertion
          this.userState = await this.addStateAsync(controlsState);
          // TODO PB 2 calls are made: 1 for add, other for update
        }
      })
      .subscribe();
  }

  private async addStateAsync(controlsState: ControlsState): Promise<UserStateModel> {
    const userState = await this.userStateRepository.updateUserState({
      mediaQueue: controlsState.mediaQueue.map(mq => mq.toEntity()),
      playedPosition: controlsState.playedPosition,
      browsingFolderPath: controlsState.currentFileExplorerPath,
      playingMediumInQueueIndex: controlsState.playingMediumInQueueIndex,
      openedPlaylistPosition: controlsState.openedPlaylistPosition
    });
    return new UserStateModel(userState);
  }

  private async updateAsync(userState: UserStateModel): Promise<UserStateModel> {
    const updateRequest = userState.toUpdateUserStateRequest();
    const updatedState = await this.userStateRepository.updateUserState(updateRequest);
    userState.setFromEntity(updatedState);

    return userState;
  }

  observeMediumQueue(): Observable<MediumInQueueModel[]> {
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
      .filter(x => !!x);
  }

  observeMediumPositionChangeByInterval(interval: number): Observable<number|null> {
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

  observeFileExplorerPathByInterval(interval: number): Observable<string> {
    return Observable
      .timer(interval, interval)
      .withLatestFrom(
        this.fileExplorerService.observeMainExplorerContent(),
        (t, m) => m.path
      )
      .distinctUntilChanged(x => x);
  }

  observeOpenedPlaylistByInterval(interval: number): Observable<number> {
    return Observable
      .timer(interval, interval)
      .withLatestFrom(
        this.playlistService.observeOpenedPlaylistPosition(),
        (t, m) => m
      )
      .distinctUntilChanged(x => x);
  }

  observeCurrentMediumIndexInQueue(): Observable<number> {
    return this.mediaQueueService.observeCurrentMediumIndexInQueue();
  }

  observeMediaVolumeChange() {
    return this.audioService
      .observeVolume()
      .debounce(500);
  }
}
