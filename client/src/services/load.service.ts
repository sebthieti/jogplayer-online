import {autoinject} from 'aurelia-framework';
import { Observable } from 'rx';
import FavoriteService from './favorite.service';
import PlaylistService from './playlist.service';

@autoinject
export default class LoadService {
  constructor(
    private playlistService: PlaylistService,
    private favoriteService: FavoriteService
  ) { }

  observeAllResourcesLoaded() {
    return Observable
      .merge(
        // this.playlistService.observePlaylistViewModels(),
        this.favoriteService.observeFavorites()
      )
      .asAsyncValue()
      .selectUnit()
      .select(x => x);
  }
}
