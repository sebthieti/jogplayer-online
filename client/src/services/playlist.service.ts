import { BehaviorSubject, Observable } from 'rx';
import {autoinject} from 'aurelia-framework';
import MediaQueueService from './mediaQueue.service';
import AudioService from './audio.service';
import AuthenticationService from './authentication.service';
import PlaylistModel from '../models/playlist.model';
import PlaylistRepository, {UpsertPlaylist} from '../repositories/playlist.repository';
import MediumModel from '../models/medium.model';
import {FileExplorerRepository} from '../repositories/fileExplorer.repository';
import {Playlist} from '../entities/playlist';

@autoinject
export default class PlaylistService {
  private playlistsSubject = new BehaviorSubject<PlaylistModel[]>(null);
  private playingMediumSubject = new BehaviorSubject<any>(null);
  private playlists: PlaylistModel[];
  private selectedPlaylistIndexSubject = new BehaviorSubject<number>(null);
  private playingPlaylistSubject = new BehaviorSubject<PlaylistModel>(null);

  constructor(
    private mediaQueueService: MediaQueueService,
    private audioService: AudioService,
    private fileExplorerRepository: FileExplorerRepository,
    private playlistRepository: PlaylistRepository
  ) {}

  async init() {
    // React on ended or next (when there's a need to change medium)
    // Get 'is current medium last' of queue
    // If it is, then get the latest one
    // If the last one is a medium from a playlist, then play next automagically

    this.mediaQueueService
      .observeQueueEndedWithMedium()
      // React only if current playing medium is a medium from playlist
      .filter(lastMediumInQueueViewModel => !!lastMediumInQueueViewModel)
      .filter(mediumVm => mediumVm.origin === 'playlist')
      .do(lastMediumInQueueViewModel => this.playNext(lastMediumInQueueViewModel))
      .subscribe();

    this.audioService
      .observePlayingMedium()
      .whereIsNotNull()
      .do((currentMedium: MediumModel) => {
        const playingPlaylist = this.playlists.find(pl => pl.hasMedium(currentMedium));
        this.playingPlaylistSubject.onNext(playingPlaylist);

        this.playingMediumSubject.onNext(currentMedium);
      })
      .subscribe();
  }

  observePlayingMedium(): Observable<any> {
    return this.playingMediumSubject.whereIsDefined();
  }

  public async loadPlaylists(): Promise<PlaylistModel[]> {
    const playlists = await this.playlistRepository.getPlaylists();
    this.playlists = playlists.map((playlist: Playlist, index: number) =>
      new PlaylistModel(playlist)
    );
    this.playlistsSubject.onNext(this.playlists);
    return this.playlists;
  }

  playNext(currentMediumInQueue: MediumModel) {
    const currentPlaylistIndex = this.selectedPlaylistIndexSubject.getValue();
    const currentPlaylist = this.playlistsSubject.getValue()[currentPlaylistIndex];
    const currentMediumIndex = currentPlaylist.findMediumIndex(currentMediumInQueue);
    // If current ended medium isn't last from playlist, then play it
    if (currentMediumIndex < currentPlaylist.media.length - 1) {
      // take next
      const nextMedium = currentPlaylist.media[currentMediumIndex+1];
      this.mediaQueueService.enqueueMediumAndStartQueue(nextMedium);
    }
  }

  private observePlayingPlaylist(): Observable<PlaylistModel> {
    return this.playingPlaylistSubject.whereIsDefined();
  }

  observeOpenedPlaylistPosition(): Observable<number> {
    return this.selectedPlaylistIndexSubject.whereIsDefined();
  }

  observeSelectedPlaylistIndex(): Observable<number> {
    return this.selectedPlaylistIndexSubject.whereIsDefined();
  }

  async addVirtualPlaylistAsync(playlist: {name: string, filePath: string}): Promise<PlaylistModel> {
    const entity = await this.playlistRepository.insertPlaylist({
      name: playlist.name,
      filePath: playlist.filePath
    } as UpsertPlaylist);

    const model = new PlaylistModel(entity);
    this.playlists.push(model);

    this.playlistsSubject.onNext(this.playlists);
    return model;
  }

  // TODO Test when fileEx turns to model
  async addPhysicalPlaylistsByFilePathsAsync(playlistFilePaths: string[]) {
    const playlists = await Promise.all(playlistFilePaths.map(path => this.playlistRepository.insertPlaylist({
      filePath: path
    } as UpsertPlaylist)));

    const models = playlists.map(playlist =>
      new PlaylistModel(playlist)
    );
    this.playlists = this.playlists.concat(models);

    this.playlistsSubject.onNext(models);
  }

  async loadMediaAsync(playlistPosition: number): Promise<MediumModel[]> {
    const media = await this.playlistRepository.getMedia(playlistPosition);
    const models = media.map(medium => new MediumModel(
      'playlist',
      medium
    ));
    this.playlists[playlistPosition].media = models;
    return models;
  }

  async getMediumFromUrl(url: string): Promise<MediumModel> {
    const medium = await this.playlistRepository.getMediumByPath(url);
    return new MediumModel('playlist', medium);
  }

  async setMediaFromUrl(playlistPosition: number, mediumPosition: number, url: string): Promise<MediumModel> {
    const model = this.playlists[playlistPosition].media[mediumPosition];
    const medium = await this.fileExplorerRepository.getMediumFromUrl(url);
    Object.assign(model, {
      name: medium.name,
      type: medium.type
    });
    return model;
  }

  async addMediumByFilePathToPlaylist(playlistPosition: number, filePath: string): Promise<MediumModel> {
    const medium = await this.playlistRepository.addMedium(
      playlistPosition,
      { mediaFilePath: filePath }
    );
    const playlist = this.playlists[playlistPosition];
    const position = (playlist.media || []).push(new MediumModel(
      'playlist',
      medium
    ));
    return playlist.media[position];
  }

  async insertMediumByFilePathToPlaylist(playlistPosition: number, insertPosition: number, filePath: string) {
    const medium = await this.playlistRepository.insertMedium(
      playlistPosition,
      insertPosition,
      filePath
    );
    const playlist = this.playlists[playlistPosition];
    const position = (playlist.media || []).push(new MediumModel(
      'playlist',
      medium
    ));
    return playlist.media[position];
  }

  async updatePlaylistAsync(position: number, model: PlaylistModel): Promise<PlaylistModel> {
    const updateRequest = model.toUpdateRequest();
    const updatedPlaylist = await this.playlistRepository.updatePlaylist(position, updateRequest);
    this.playlists[position] = model.setFromEntity(updatedPlaylist);

    return model;
  }

  async removeMedium(playlistPosition: number, mediumPosition: number): Promise<void> {
    await this.playlistRepository.removeMedium(playlistPosition, mediumPosition);
    this.playlists[playlistPosition].media.splice(mediumPosition, 1);
  }

  async removePlaylistAsync(position: number): Promise<void> {
    await this.playlistRepository.deletePlaylist(position);

    const currentPlaylistIndex = this.selectedPlaylistIndexSubject.getValue();
    if (currentPlaylistIndex === position) {
      // Reset current playlist if it was the current one.
      this.selectedPlaylistIndexSubject.onNext(-1);
    }
  }

  async removeMediumFromPlaylist(playlistIndex: number, mediumIndex: number) {
    await this.playlistRepository.removeMedium(playlistIndex, mediumIndex);
    this.playlists[playlistIndex].media.splice(mediumIndex, 1);

    this.playlistsSubject.onNext(this.playlists);
  }

  selectPlaylistByIndexAsync(playlistIndex: number): void {
    this.selectedPlaylistIndexSubject.onNext(playlistIndex);
  }

  playlistSelected(playlistIndex: number): void {
    this.selectedPlaylistIndexSubject.onNext(playlistIndex);
  }

  playMedium(playlistIndex: number, mediumIndex: number) {
    this.mediaQueueService.enqueueMediumAndStartQueue(
      this.playlists[playlistIndex].media[mediumIndex]
    );
  }

  addFilesToSelectedPlaylist(filePaths: string[]): Promise<MediumModel[]> {
    const selectedPlaylistPosition = this.selectedPlaylistIndexSubject.getValue();
    return Promise.all(filePaths.map(filePath =>
      this.addMediumByFilePathToPlaylist(selectedPlaylistPosition, filePath)
    ));
  }
}
