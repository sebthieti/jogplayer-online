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
import {IPlaylistService} from '../services/m3uPlaylist.service';
import {IUserCache} from '../cache/user.cache';
import {IPlaylistRepository} from '../repositories/playlist.repository';
import {IUserRepository} from '../repositories/user.repository';
import {IFavoriteRepository} from '../repositories/favorite.repository';
import {IUserPermissionsRepository} from '../repositories/userPermissions.repository';
import {IUserStateRepository} from '../repositories/userState.repository';

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
    (): IPlaylistDirector => new PlaylistDirector()
  );
  container.register(
    'authDirector',
    (userDirector: IUserDirector): IAuthDirector => new AuthDirector(userDirector)
  );
  container.register(
    'playlistsDirector',
    (): IPlaylistsDirector => new PlaylistsDirector()
  );
  container.register(
    'fileExplorerDirector',
    (fileExplorerService: IFileExplorerService): IFileExplorerDirector =>
      new FileExplorerDirector(fileExplorerService)
  );
  container.register(
    'favoriteDirector',
    (): IFavoriteDirector => new FavoriteDirector()
  );
  container.register(
    'userDirector',
    (
      userRepository: IUserRepository,
      playlistService: IPlaylistService,
      mediaRepository: IMediaRepository,
      playlistRepository: IPlaylistRepository,
      mediaService: IMediaService,
      fileExplorerService: IFileExplorerService,
      userCache: IUserCache,
      favoriteRepository: IFavoriteRepository,
      userPermissionsRepository: IUserPermissionsRepository,
      userStateRepository: IUserStateRepository
    ): IUserDirector => new UserDirector(
      userRepository,
      playlistService,
      mediaRepository,
      playlistRepository,
      mediaService,
      fileExplorerService,
      favoriteRepository,
      userPermissionsRepository,
      userStateRepository,
      userCache
    )
  );
  container.register(
    'userStateDirector',
    (): IUserStateDirector => new UserStateDirector()
  );
  container.register(
    'permissionsDirector',
    (): IUserPermissionsDirector => new UserPermissionsDirector()
  );
  container.register(
    'configDirector',
    (userDirector: IUserDirector) => new ConfigDirector(userDirector)
  );
}
