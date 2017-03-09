import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import * as _ from 'lodash';

import {nfcall} from '../utils/promiseHelpers';
import {IFileExplorerService} from './fileExplorers/fileExplorer.service';
import {IPathBuilder} from '../utils/pathBuilder';
import {IMediaBuilder} from '../invokers/mediaBuilder';
import {Playlist} from '../models/playlist.model';
import {IMediumSummary} from '../entities/mediumSummary';

export interface IPlaylistService {
  loadMediaSummariesFromPlaylistAsync(filePath: string): Promise<IMediumSummary[]>;
  savePlaylistAsync(playlist: Playlist): Promise<Playlist>;
  isOfType(filePath: string): boolean;
}

export default class M3UPlaylistService implements IPlaylistService {
  private Extended = '#EXTM3U';

  constructor(
    private fileExplorer: IFileExplorerService,
    private pathBuilder: IPathBuilder,
    private mediaBuilder: IMediaBuilder
  ) {
  }

  async loadMediaSummariesFromPlaylistAsync(filePath: string): Promise<IMediumSummary[]> {
    const playlistContent = await this.readPlaylistAsync(filePath);
    return this.parsePlaylist(playlistContent, filePath);
  }

  async savePlaylistAsync(playlist: Playlist): Promise<Playlist> {
    let lines = new Array(playlist.media.length * 2 + 1); // 2 lines per title + header
    lines[0] = this.Extended;
    let cursor = 0;
    playlist.media.forEach(medium => {
      lines[++cursor] = this.generateLine(medium.title, medium.duration);
      lines[++cursor] = this.pathBuilder.toRelativePath(playlist.filePath, medium.filePath);
    });

    // TODO fileExplorer.getNewLineConstant won't work need to crank up strategy before
    const linesToString = lines.join(this.fileExplorer.getNewLineConstant());
    await nfcall(
      fs.writeFile,
      playlist.filePath,
      linesToString
    );
    return playlist;
  }

  isOfType(filePath: string): boolean {
    const ext = path.extname(filePath).toLowerCase();
    return ext === '.m3u' || ext === '.m3u8';
  }

  private readPlaylistAsync(filePath: string): Promise<string> {
    return nfcall(
      fs.readFile,
      filePath,
      {encoding: 'utf8'}
    );
  }

  private parsePlaylist(playlistContent: string, filePath: string): IMediumSummary[] {
    let playlistContentParsed = _(playlistContent.split(os.EOL))
      .dropWhile(c => c.indexOf(this.Extended) !== -1)
      .drop(1)
      .value();

    let medias: IMediumSummary[] = [];
    for (let lineIndex = 0; lineIndex < playlistContentParsed.length; lineIndex++) {
      let mediaFirstLine = playlistContentParsed[lineIndex];
      if (!mediaFirstLine) {
        continue;
      }

      let durationAndTitle = mediaFirstLine
        .slice(mediaFirstLine.indexOf(':') + 1)
        .split(',');

      let durationStr = durationAndTitle[0];
      let duration = parseInt(durationStr, 0);
      if (isNaN(duration)) {
        duration = -1;
      }

      let title = durationAndTitle[1];

      lineIndex++;

      let mediaPath = playlistContentParsed[lineIndex];

      let media = this.mediaBuilder.buildMediumSummary(
        this.pathBuilder.toAbsolutePath(filePath, mediaPath),
        title,
        medias.length,
        duration
      );

      medias.push(media);
    }

    return medias;
  }

  private generateLine(title: string, duration: number): string {
    return '#EXTINF:' + Math.round(duration) + ',' + title;
  }
}
