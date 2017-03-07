import * as EventEmitter from 'events';
import {Playlist} from '../models/playlist.model';
import {User} from '../models/user.model';

export interface IPlaylistInsertEvent {
  playlist: Playlist;
  user: User;
}

export interface IEvents {
  emitPlaylistUpdate(issuerId: string);
  onPlaylistUpdate(fn: (issuerId: string) => void);
  emitPlaylistsInsert(playlistInfos: IPlaylistInsertEvent);
  onPlaylistsInsert(fn: (playlistInfos: IPlaylistInsertEvent) => void);
  emitPlaylistsRemove(playlistId: string);
  onPlaylistsRemove(fn: (playlistId: string) => void);
  emitConfigReady(config: any);
  onConfigReady(cfg: (config) => void);
  emitConfigFileIsValid(exists: boolean);
  onConfigFileIsValid(cfg: (exists: boolean) => void);
  emitDbConnectionReady();
  onDbConnectionReady(cfg: () => void);
}

export default class Events implements IEvents {
  private emitter = new EventEmitter();

  emitPlaylistUpdate(issuerId: string) {
    this.emitter.emit('playlist.update', issuerId);
  }

  onPlaylistUpdate(fn: (issuerId: string) => void) {
    this.emitter.on('playlist.update', fn);
  }

  emitPlaylistsInsert(playlistInfos: IPlaylistInsertEvent) {
    this.emitter.emit('playlists.insert', playlistInfos);
  }

  onPlaylistsInsert(fn: (playlistInfos: IPlaylistInsertEvent) => void) {
    this.emitter.on('playlists.insert', fn);
  }

  emitPlaylistsRemove(playlistId: string) {
    this.emitter.emit('playlists.remove', playlistId);
  }

  onPlaylistsRemove(fn: (playlistId: string) => void) {
    this.emitter.on('playlists.remove', fn);
  }

  emitConfigReady(config: any) {
    this.emitter.emit('config.ready', config);
  }

  onConfigReady(cfg: (config) => void) {
    this.emitter.once('config.ready', cfg);
  }

  emitConfigFileIsValid(exists: boolean) {
    this.emitter.emit('config.is-valid', exists);
  }

  onConfigFileIsValid(cfg: (exists: boolean) => void) {
    this.emitter.on('config.is-valid', cfg);
  }

  emitDbConnectionReady() {
    this.emitter.emit('dbConnection.ready');
  }

  onDbConnectionReady(cfg: () => void) {
    this.emitter.on('dbConnection.ready', cfg);
  }
}
