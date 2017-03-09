import Repository from './repository';
import MediaRepository from './media.repository';
import PlaylistRepository from './playlist.repository';
import {IMediaRepository} from './media.repository';
import FavoriteRepository from './favorite.repository';
import UserRepository from './user.repository';
import {IRepository} from './repository';
import {IUserRepository} from './user.repository';
import {IFavoriteRepository} from './favorite.repository';
import {IPlaylistRepository} from './playlist.repository';
import UserStateRepository from './userState.repository';
import {IUserStateRepository} from './userState.repository';
import UserPermissionsRepository from './userPermissions.repository';
import ConfigRepository from './config.repository';
import {IUserPermissionsRepository} from './userPermissions.repository';
import {IConfigRepository} from './config.repository';
import {IEvents} from '../events/index';
import {IMediumModel} from '../models/medium.model';
import {IPlaylistModel} from '../models/playlist.model';
import {IFavoriteModel} from '../models/favorite.model';
import {IUserModel} from '../models/user.model';
import {IUserStateModel} from '../models/userState.model';
import {IUserPermissionsModel} from '../models/userPermissions.model';

export default function bootstrap(container: any) {
  container.register(
    'repository',
    (events: IEvents): IRepository => new Repository(events)
  );
  container.register(
    'mediaRepository',
    (mediaModel: IMediumModel): IMediaRepository => new MediaRepository(mediaModel)
  );
  container.register(
    'playlistRepository',
    (playlistModel: IPlaylistModel, mediaRepository: IMediaRepository): IPlaylistRepository =>
      new PlaylistRepository(playlistModel, mediaRepository)
  );
  container.register(
    'favoriteRepository',
    (favoriteModel: IFavoriteModel): IFavoriteRepository =>
      new FavoriteRepository(favoriteModel)
  );
  container.register(
    'userRepository',
    (repository: IRepository, userModel: IUserModel): IUserRepository =>
      new UserRepository(repository, userModel)
  );
  container.register(
    'userStateRepository',
    (userStateModel: IUserStateModel): IUserStateRepository =>
      new UserStateRepository(userStateModel)
  );
  container.register(
    'userPermissionsRepository',
    (userPermissionsModel: IUserPermissionsModel): IUserPermissionsRepository =>
      new UserPermissionsRepository(userPermissionsModel)
  );
  container.register(
    'configRepository',
    (userModel: IUserModel): IConfigRepository => new ConfigRepository(userModel)
  );
}
