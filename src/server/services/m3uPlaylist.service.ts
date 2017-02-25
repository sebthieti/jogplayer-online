import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import * as _ from 'lodash';

import mediaBuilder from '../invokers/mediaBuilder';
import {nfcall} from '../utils/promiseHelpers';
import {IFileExplorerService} from './fileExplorers/fileExplorer.service';
import {IPathBuilder} from '../utils/pathBuilder';

export interface IPlaylistService {
  loadMediaSummariesFromPlaylistAsync(filePath);
  savePlaylistAsync(playlist);
  isOfType(filePath);
}

export default class M3UPlaylistService implements IPlaylistService {
  private Extended = '#EXTM3U';

  constructor(
    private fileExplorer: IFileExplorerService,
    private pathBuilder: IPathBuilder
  ) {
  }

  loadMediaSummariesFromPlaylistAsync(filePath) {
    return this.readPlaylistAsync(filePath)
      .then(playlistContent => {
        return this.parsePlaylist(playlistContent, filePath);
      });
  }

  savePlaylistAsync(playlist) {
    let lines = new Array(playlist.media.length * 2 + 1); // 2 lines per title + header
    lines[0] = this.Extended;
    let cursor = 0;
    playlist.media.forEach(medium => {
      lines[++cursor] = this.generateLine(medium.title, medium.duration);
      lines[++cursor] = this.pathBuilder.toRelativePath(playlist.filePath, medium.filePath);
    });

    // TODO fileExplorer.getNewLineConstant won't work need to crank up strategy before
    const linesToString = lines.join(this.fileExplorer.getNewLineConstant());
    return nfcall(
      fs.writeFile,
      playlist.filePath,
      linesToString
    )
    .then(() => playlist);
  }

  isOfType(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    return ext === '.m3u' || ext === '.m3u8';
  }

  private readPlaylistAsync(filePath) {
    return nfcall(
      fs.readFile,
      filePath,
      {encoding: 'utf8'}
    );
  }

  private parsePlaylist(playlistContent: string, filePath) {
    let playlistContentParsed = _(playlistContent.split(os.EOL))
      .dropWhile(c => c.indexOf(this.Extended) !== -1)
      .drop(1)
      .value();

    let medias = [];
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

      let media = mediaBuilder.buildMediumSummary(
        this.pathBuilder.toAbsolutePath(filePath, mediaPath),
        title,
        medias.length,
        duration);

      medias.push(media);
    }

    return medias;
  }

  private generateLine(title, duration) {
    return '#EXTINF:' + Math.round(duration) + ',' + title;
  }
}
