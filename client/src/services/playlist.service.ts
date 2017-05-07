import { BehaviorSubject, Observable } from 'rx';
import {autoinject} from 'aurelia-framework';
import MediaQueueService from './mediaQueue.service';
import AudioService from './audio.service';
import AuthenticationService from './authentication.service';
import PlaylistModel from '../models/playlist.model';
import PlaylistRepository, {UpsertPlaylist} from '../repositories/playlist.repository';
import MediumModel from '../models/medium.model';
import {FileExplorerRepository} from '../repositories/fileExplorer.repository';

@autoinject
export default class PlaylistService {
  // private playlistViewModelsSubject = new Rx.BehaviorSubject();
  private playlistsSubject = new BehaviorSubject<PlaylistModel[]>();
  private playingPlaylistSubject = new BehaviorSubject();
  private playingMediumSubject = new BehaviorSubject();
  private playlists: PlaylistModel[];
  private currentPlaylistSubject = new BehaviorSubject<PlaylistModel>();

  constructor(
    private mediaQueueService: MediaQueueService,
    private audioService: AudioService,
    private authenticationService: AuthenticationService,
    private fileExplorerRepository: FileExplorerRepository,
    private playlistRepository: PlaylistRepository
  ) {
    this.init();
  }

  private async init() {
    // React on ended or next (when there's a need to change medium)
    // Get 'is current medium last' of queue
    // If it is, then get the latest one
    // If the last one is a medium from a playlist, then play next automagically

    this.mediaQueueService
      .observeQueueEndedWithMedium()
      // React only if current playing medium is a medium from playlist
      .filter(lastMediumInQueueViewModel => lastMediumInQueueViewModel)
      .do(lastMediumInQueueViewModel => this.playNext(lastMediumInQueueViewModel))
      .subscribe();

    this.loadPlaylists();
    this.clearPlaylistsOnUserLogoff();

    this.audioService
      .observePlayingMedium()
      .whereIsNotNull()
      .do((currentMedium: MediumModel) => {
        // Is medium from playlist of file system ?
        // if (!currentMedium.model.playlistId) {
        //   this.playingPlaylistSubject.onNext(null);
        //   return;
        // }

        const playingPlaylist = this.playlists.find(pl => pl.hasMedium(currentMedium));
        this.playingPlaylistSubject.onNext(playingPlaylist);

        // var currentMedium = findMediumFromOtherViewModelAsAsyncValue(currentMediumViewModel);
        // playingMediumSubject.onNext(currentMedium);
      })
      .subscribe();
  }

  // private findMediumFromOtherViewModelAsAsyncValue(playingMediumViewModel) {
  //   return Rx.Observable.create(function(observer) {
  //     if (!playingMediumViewModel || !angular.isDefined(playingMediumViewModel.model.id)) {
  //       return;
  //     }
  //
  //     var playingMediumId = playingMediumViewModel.model.id;
  //     observePlayingPlaylist().getValueAsync(function(playingPlaylist) {
  //       var mediumVm = _.find(playingPlaylist.media, function(mediumVm) {
  //         return mediumVm.model.id === playingMediumId;
  //       });
  //
  //       observer.onNext(mediumVm);
  //       observer.onCompleted();
  //     });
  //   });
  // }

  private async loadPlaylists() {
    const playlists = await this.playlistRepository.getPlaylists();
    this.playlists = playlists.map(playlist => new PlaylistModel(
      this.playlistRepository,
      this.fileExplorerRepository,
      this.mediaQueueService,
      playlist
    ));
    this.playlistsSubject.onNext(this.playlists);
  }

  private clearPlaylistsOnUserLogoff() {
    this.authenticationService
      .observeCurrentUserAuthentication()
      .whereIsNull()
      .do(() => {
        this.playlistsSubject.onNext([]);
        this.playlists = [];
      })
      .subscribe();
  }

  playNext(currentMediumInQueue: MediumModel) {
    const currentPlaylist = this.currentPlaylistSubject.getValue();
    const currentMediumIndex: number = currentPlaylist.findMediumIndex(currentMediumInQueue);
    // If current ended medium isn't last from playlist, then play it
    if (currentMediumIndex < currentPlaylist.media.length - 1) {
      // take next
      const nextMedium = currentPlaylist.media[currentMediumIndex+1];
      this.mediaQueueService.enqueueMediumAndStartQueue(nextMedium.model);
    }
  }

  private observePlayingPlaylist(): Observable<PlaylistModel> {
    return this.playingPlaylistSubject.whereIsDefined();
  }

  observeCurrentPlaylist(): Observable<PlaylistModel> {
    return this.currentPlaylistSubject.whereIsDefined();
  }

  selectPlaylistByIndexAsync(playlistIndex: number): void {
    this.currentPlaylistSubject.onNext(this.playlists[playlistIndex]);
  }

  async addVirtualPlaylistAsync(playlist: {name: string, filePath: string}) {
    const entity = await this.playlistRepository.insertPlaylist({
      name: playlist.name,
      filePath: playlist.filePath
    } as UpsertPlaylist);

    const model = new PlaylistModel(
      this.playlistRepository,
      this.fileExplorerRepository,
      this.mediaQueueService,
      entity
    );
    this.playlists.push(model);

    this.playlistsSubject.onNext(this.playlists);
  }

  // TODO Test when fileEx turns to model
  async addPhysicalPlaylistsByFilePathsAsync(playlistFilePaths: string[]) {
    const playlists = await Promise.all(playlistFilePaths.map(path => this.playlistRepository.insertPlaylist({
      filePath: path
    } as UpsertPlaylist)));

    const models = playlists.map(playlist => new PlaylistModel(
      this.playlistRepository,
      this.fileExplorerRepository,
      this.mediaQueueService,
      playlist));
    this.playlists.concat(models);

    this.playlistsSubject.onNext(models);
  }

  async removePlaylistAsync(playlist: PlaylistModel): Promise<void> {
    const index = this.playlists.findIndex(pl => pl === playlist);
    await this.playlistRepository.deletePlaylist(index);

    const currentPlaylist = this.currentPlaylistSubject.getValue();
    if (currentPlaylist === playlist) {
      // Reset current playlist if it was the current one.
      this.currentPlaylistSubject.onNext(null);
    }
  }

  addFilesToSelectedPlaylist(filePaths: string[]): Promise<MediumModel[]> {
    const currentPlaylist: PlaylistModel = this.currentPlaylistSubject.getValue();
    return Promise.all(filePaths.map(filePath => {
      return currentPlaylist.addMediumByFilePathToPlaylist(filePath)
    }));
  }
}
