import {ExplorerService} from './explorer.service';
import {autoinject} from 'aurelia-framework';
import MediaQueueService from './mediaQueue.service';
import FavoriteService from './favorite.service';

// TODO Rather filter in server with where clause in fileExp endpoint
@autoinject
export default class PlaylistExplorerService extends ExplorerService {
  constructor(favoriteService: FavoriteService, mediaQueueService: MediaQueueService) {
    super(favoriteService, mediaQueueService);
    this.init(false, 'm3u');
  }
}
