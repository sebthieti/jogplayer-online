import MediaBuilder, {IMediaBuilder} from '../invokers/mediaBuilder';
import PlaylistBuilder, {IPlaylistBuilder} from '../invokers/playlistBuilder';
import {IMediaService} from '../services/media.service';
import {IFileExplorerService} from '../services/fileExplorers/fileExplorer.service';
import {IMediaModel} from '../models/media.model';

export default function bootstrap(container: any) {
  container.register(
    'mediaBuilder',
    (mediaService: IMediaService, mediaModel: IMediaModel): IMediaBuilder =>
      new MediaBuilder(mediaService, mediaModel)
  );
  container.register(
    'playlistBuilder',
    (fileExplorerService: IFileExplorerService): IPlaylistBuilder =>
      new PlaylistBuilder(fileExplorerService)
  );
}
