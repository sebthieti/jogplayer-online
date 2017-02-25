import MediaStreamer, {IMediaStreamer} from '../stream/mediaStreamer';
import {IMediaDirector} from '../directors/media.director';
import {IFileExplorerService} from '../services/fileExplorers/fileExplorer.service';

export default function bootstrap(container: any) {
  container.register(
    'mediaStreamer',
    (mediaDirector: IMediaDirector, fileExplorerService: IFileExplorerService): IMediaStreamer =>
      new MediaStreamer(mediaDirector, fileExplorerService)
  );
}
