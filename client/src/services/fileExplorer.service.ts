import {autoinject} from 'aurelia-framework';
import {ExplorerService} from './explorer.service';
import MediaQueueService from './mediaQueue.service';
import AuthenticationService from './authentication.service';
import {FileExplorerRepository} from '../repositories/fileExplorer.repository';

@autoinject
export default class FileExplorerService extends ExplorerService {
  constructor(
    authenticationService: AuthenticationService,
    mediaQueueService: MediaQueueService,
    fileExplorerRepository: FileExplorerRepository
  ) {
    super(authenticationService, mediaQueueService, fileExplorerRepository);
  }
}
