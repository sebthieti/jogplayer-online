import MediaService, {IMediaService} from './media.service';
import FileExplorerServiceStrategy from './fileExplorers/fileExplorerStrategy.service';
import {IFileExplorerService} from './fileExplorers/fileExplorer.service';
import M3UPlaylistService, {IPlaylistService} from './m3uPlaylist.service';
import {IPathBuilder} from '../utils/pathBuilder';
import ConfigService, {IConfigService} from './config.service';
import {IEvents} from '../events/index';
import {IMediaBuilder} from '../invokers/mediaBuilder';

/**
 * @description
 *
 * Register all components needed to run the service layer, to IoC.
 */
export default function bootstrap(container: any) {
  container.register('mediaService', (): IMediaService => new MediaService());
  container.register('fileExplorerService', (): IFileExplorerService =>
    new FileExplorerServiceStrategy().buildFileExplorerService()
  );
  // TODO Should contain a list of.
  container.register('playlistServices', (
    fileExplorerService: IFileExplorerService,
    pathBuilder: IPathBuilder,
    mediaBuilder: IMediaBuilder
  ): IPlaylistService => new M3UPlaylistService(
    fileExplorerService,
    pathBuilder,
    mediaBuilder
  ));
  container.register('configService', (events: IEvents): IConfigService =>
    new ConfigService(events)
  );
}
