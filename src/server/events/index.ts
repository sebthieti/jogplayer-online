import * as EventEmitter from 'events';
import {Playlist} from '../entities/playlist';
import {User} from '../entities/user';

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

  emitDbConnectionReady() {
    this.emitter.emit('dbConnection.ready');
  }

  onDbConnectionReady(cfg: () => void) {
    this.emitter.on('dbConnection.ready', cfg);
  }
}
