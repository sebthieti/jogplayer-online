import {ExplorerService} from './explorer.service';
import {autoinject} from 'aurelia-framework';
import MediaQueueService from './mediaQueue.service';
import FavoriteService from './favorite.service';

@autoinject
export default class FileExplorerService extends ExplorerService {
  constructor(favoriteService: FavoriteService, mediaQueueService: MediaQueueService) {
    super(favoriteService, mediaQueueService);
    this.init(true);
  }
}
