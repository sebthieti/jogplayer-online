import MediaBuilder, {IMediaBuilder} from '../invokers/mediaBuilder';
import PlaylistBuilder, {IPlaylistBuilder} from '../invokers/playlistBuilder';
import {IMediaService} from '../services/media.service';
import {IFileExplorerService} from '../services/fileExplorers/fileExplorer.service';
import {IMediumModel} from '../models/medium.model';
import {IPlaylistModel} from '../models/playlist.model';

export default function bootstrap(container: any) {
  container.register(
    'mediaBuilder',
    (mediaService: IMediaService, mediaModel: IMediumModel): IMediaBuilder =>
      new MediaBuilder(mediaService, mediaModel)
  );
  container.register(
    'playlistBuilder',
    'playlistModel',
    (fileExplorerService: IFileExplorerService, playlistModel: IPlaylistModel): IPlaylistBuilder =>
      new PlaylistBuilder(fileExplorerService, playlistModel)
  );
}
