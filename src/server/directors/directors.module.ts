import MediaDirector, {IMediaDirector} from './media.director';
import PlaylistDirector, {IPlaylistDirector} from './playlist.director';
import AuthDirector, {IAuthDirector} from './auth.director';
import PlaylistsDirector, {IPlaylistsDirector} from './playlists.director';
import FileExplorerDirector, {IFileExplorerDirector} from './fileExplorer.director';
import FavoriteDirector, {IFavoriteDirector} from './favorite.director';
import UserDirector, {IUserDirector} from './user.director';
import UserStateDirector, {IUserStateDirector} from './userState.director';
import UserPermissionsDirector, {IUserPermissionsDirector} from './userPermissions.director';
import ConfigDirector from './config.director';

import {IMediaRepository} from '../repositories/media.repository';
import {IMediaService} from '../services/media.service';
import {IFileExplorerService} from '../services/fileExplorers/fileExplorer.service';
import {IPlaylistProxy} from '../proxies/playlist.proxy';
import {IPlaylistsProxy} from '../proxies/playlists.proxy';
import {IPlaylistService} from '../services/m3uPlaylist.service';
import {IUserProxy} from '../proxies/user.proxy';
import {IPlaylistRepository} from '../repositories/playlist.repository';
import {IFavoriteProxy} from '../proxies/favorite.proxy';
import {IUserStateProxy} from '../proxies/userState.proxy';
import {IUserRepository} from '../repositories/user.repository';
import {IEvents} from '../events/index';
import {IConfigService} from '../services/config.service';
import {IPlaylistBuilder} from '../invokers/playlistBuilder';
import {IMediaBuilder} from '../invokers/mediaBuilder';

/**
 * @description
 *
 * Register the business layer components in IoC
 */
export default function (container: any) {
  container.register(
    'mediaDirector',
    (
      mediaRepository: IMediaRepository,
      mediaService: IMediaService,
      fileExplorerService: IFileExplorerService
    ): IMediaDirector => new MediaDirector(mediaRepository, mediaService, fileExplorerService)
  );
  container.register(
    'playlistDirector',
    (
      playlistProxy: IPlaylistProxy,
      playlistsProxy: IPlaylistsProxy,
      mediaRepository: IMediaRepository,
      fileExplorerService: IFileExplorerService,
      playlistServices: IPlaylistService,
      mediaBuilder: IMediaBuilder
    ): IPlaylistDirector => new PlaylistDirector(
      playlistProxy,
      playlistsProxy,
      mediaRepository,
      fileExplorerService,
      playlistServices,
      mediaBuilder
    )
  );
  container.register(
    'authDirector',
    (userProxy: IUserProxy): IAuthDirector => new AuthDirector(userProxy)
  );
  container.register(
    'playlistsDirector',
    (
      playlistDirector: IPlaylistDirector,
      playlistRepository: IPlaylistRepository,
      playlistsProxy: IPlaylistsProxy,
      playlistBuilder: IPlaylistBuilder
    ): IPlaylistsDirector => new PlaylistsDirector(
      playlistDirector,
      playlistRepository,
      playlistsProxy,
      playlistBuilder
    )
  );
  container.register(
    'fileExplorerDirector',
    (fileExplorerService: IFileExplorerService): IFileExplorerDirector =>
      new FileExplorerDirector(fileExplorerService)
  );
  container.register(
    'favoriteDirector',
    (favoriteProxy: IFavoriteProxy): IFavoriteDirector =>
      new FavoriteDirector(favoriteProxy)
  );
  container.register(
    'userDirector',
    (
      userProxy: IUserProxy,
      userPermissionsDirector: IUserPermissionsDirector
    ): IUserDirector => new UserDirector(
      userProxy,
      userPermissionsDirector
    )
  );
  container.register(
    'userStateDirector',
    (userStateProxy: IUserStateProxy): IUserStateDirector =>
      new UserStateDirector(userStateProxy)
  );
  container.register(
    'userPermissionsDirector',
    (userRepository: IUserRepository): IUserPermissionsDirector =>
      new UserPermissionsDirector(userRepository)
  );
  container.register(
    'configDirector',
    (events: IEvents, userDirector: IUserDirector, configService: IConfigService) =>
      new ConfigDirector(events, userDirector, configService)
  );
}
