import * as path from 'path';
import * as fs from 'fs';
import {Stats} from 'fs';
import {nfcall} from '../utils/promiseHelpers';
import {IFileExplorerService} from '../services/fileExplorers/fileExplorer.service';
import {User} from '../models/user.model';
import {IPlaylistModel, Playlist} from '../models/playlist.model';

export interface IPlaylistBuilder {
  buildEmptyVirtualPlaylist(name: string, index: number, issuer: User): Playlist;
  buildVirtualPlaylist(name: string, index: number, issuer: User): Playlist;
  buildEmptyPhysicalPlaylistAsync(
    playlistFilePath: string,
    name: string,
    index: number,
    issuer: User
  ): Promise<Playlist>;
}

export default class PlaylistBuilder implements IPlaylistBuilder {
  private Playlist: IPlaylistModel;

  constructor(
    private fileExplorer: IFileExplorerService,
    private playlistModel: IPlaylistModel
  ) {
    this.Playlist = playlistModel;
  }

  // TODO Use builder pattern (add each property by a method)
  buildEmptyVirtualPlaylist(name: string, index: number, issuer: User): Playlist {
    return this.buildVirtualPlaylist(name, index, issuer);
  }

  buildVirtualPlaylist(name: string, index: number, issuer: User): Playlist {
    return new this.Playlist({
      ownerId: issuer.id,
      name: name,
      index: index,
      filePath: '',
      checked: true,
      isAvailable: true,
      createdOn: new Date().toUTCString()
    });
  }

  async buildEmptyPhysicalPlaylistAsync(
    playlistFilePath: string,
    name: string,
    index: number,
    issuer: User
  ): Promise<Playlist> {
    const normalizedPlaylistFilePath = this.fileExplorer.normalizePathForCurrentOs(playlistFilePath);
    let playlistName = '';
    if (name) {
      playlistName = name;
    } else {
      const plExt = path.extname(normalizedPlaylistFilePath);
      playlistName = path.basename(normalizedPlaylistFilePath, plExt);
    }

    const stat = await nfcall<Stats>(fs.stat, normalizedPlaylistFilePath);

    return new this.Playlist({
      ownerId: issuer.id,
      name: playlistName,
      index: index,
      filePath: normalizedPlaylistFilePath,
      checked: true,
      isAvailable: true,
      createdOn: stat.ctime,
      updatedOn: stat.mtime
    });
  }
}
