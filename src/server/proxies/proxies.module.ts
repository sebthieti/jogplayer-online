import UserProxy, {IUserProxy} from './user.proxy';
import FavoriteProxy, {IFavoriteProxy} from './favorite.proxy';
import PlaylistProxy, {IPlaylistProxy} from './playlist.proxy';
import PlaylistsProxy, {IPlaylistsProxy} from './playlists.proxy';
import UserStateProxy, {IUserStateProxy} from './userState.proxy';
import {ICache, default as Cache} from './cache';
import {IEvents} from '../events/index';
import {IUserRepository} from '../repositories/user.repository';
import {IFavoriteRepository} from '../repositories/favorite.repository';
import {IPlaylistRepository} from '../repositories/playlist.repository';
import {IUserStateRepository} from '../repositories/userState.repository';

/**
 * @description
 *
 * Register all proxies components, that is all caches, to IoC.
 */
export default function bootstrap(container: any) {
  container.register(
    'userProxy',
    (cache: ICache, events: IEvents, userRepository: IUserRepository): IUserProxy =>
      new UserProxy(cache, events, userRepository)
  );
  container.register(
    'favoriteProxy',
    (favoriteRepository: IFavoriteRepository): IFavoriteProxy =>
      new FavoriteProxy(favoriteRepository)
  );
  container.register(
    'playlistProxy',
    (cache: ICache, events: IEvents, playlistRepository: IPlaylistRepository): IPlaylistProxy =>
      new PlaylistProxy(cache, events, playlistRepository)
  );
  container.register(
    'playlistsProxy',
    (cache: ICache, events: IEvents, playlistRepository: IPlaylistRepository): IPlaylistsProxy =>
      new PlaylistsProxy(cache, events, playlistRepository)
  );
  container.register(
    'userStateProxy',
    (cache: ICache, userStateRepository: IUserStateRepository): IUserStateProxy =>
      new UserStateProxy(cache, userStateRepository)
  );
  container.register('cache', (): ICache => new Cache());
}
