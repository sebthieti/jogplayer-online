import * as path from 'path';
import * as fs from 'fs';
import {Stats} from 'fs';
import Playlist from '../models/playlist.model';
import {nfcall} from '../utils/promiseHelpers';
import {IFileExplorerService} from '../services/fileExplorers/fileExplorer.service';

export interface IPlaylistBuilder {
  buildEmptyVirtualPlaylist(name, index, issuer);
  buildVirtualPlaylist(name, index, issuer);
  buildEmptyPhysicalPlaylistAsync(playlistFilePath, name, index, issuer);
}

export default class PlaylistBuilder implements IPlaylistBuilder {
  constructor(private fileExplorer: IFileExplorerService) {
  }

  // TODO Use builder pattern (add each property by a method)
  buildEmptyVirtualPlaylist(name, index, issuer) {
    return this.buildVirtualPlaylist(name, index, issuer);
  }

  buildVirtualPlaylist(name, index, issuer) {
    return new Playlist({
      ownerId: issuer.id,
      name: name,
      index: index,
      filePath: '',
      checked: true,
      isAvailable: true,
      createdOn: new Date().toUTCString()
    });
  }

  buildEmptyPhysicalPlaylistAsync(playlistFilePath, name, index, issuer) {
    const normalizedPlaylistFilePath = this.fileExplorer.normalizePathForCurrentOs(playlistFilePath);
    let playlistName = '';
    if (name) {
      playlistName = name;
    } else {
      const plExt = path.extname(normalizedPlaylistFilePath);
      playlistName = path.basename(normalizedPlaylistFilePath, plExt);
    }

    return nfcall(fs.stat, normalizedPlaylistFilePath)
      .then((stat: Stats) => {
        return new Playlist({
          ownerId: issuer.id,
          name: playlistName,
          index: index,
          filePath: normalizedPlaylistFilePath,
          checked: true,
          isAvailable: true,
          createdOn: stat.ctime,
          updatedOn: stat.mtime
        });
      });
  }
}
