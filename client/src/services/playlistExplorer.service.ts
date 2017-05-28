import {ExplorerService} from './explorer.service';
import {autoinject} from 'aurelia-framework';
import MediaQueueService from './mediaQueue.service';
import AuthenticationService from './authentication.service';
import {FileExplorerRepository} from '../repositories/fileExplorer.repository';

// TODO Rather filter in server with where clause in fileExp endpoint
@autoinject
export default class PlaylistExplorerService extends ExplorerService {
  constructor(
    authenticationService: AuthenticationService,
    mediaQueueService: MediaQueueService,
    fileExplorerRepository: FileExplorerRepository
  ) {
    super(authenticationService, mediaQueueService, fileExplorerRepository, 'm3u');
  }
}
