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
import {IUserPermissionsRepository} from './userPermissions.repository';
import {IEvents} from '../events/index';
import {IMongoDbContext, MongoDbContext} from './mongoDb.context';

export default function bootstrapAsync(container: any): Promise<void> {
  // TODO Inject this one
  //import * as config from 'config';
  container.register(
    'dbContext',
    (events: IEvents): IMongoDbContext => new MongoDbContext(events)
  );

  container.register(
    'repository',
    (events: IEvents): IRepository => new Repository(events)
  );
  container.register(
    'mediaRepository',
    (dbContext: IMongoDbContext): IMediaRepository => new MediaRepository(dbContext)
  );
  container.register(
    'playlistRepository',
    (dbContext: IMongoDbContext): IPlaylistRepository => new PlaylistRepository(dbContext)
  );
  container.register(
    'favoriteRepository',
    (dbContext: IMongoDbContext): IFavoriteRepository =>
      new FavoriteRepository(dbContext)
  );
  container.register(
    'userRepository',
    (dbContext: IMongoDbContext): IUserRepository =>
      new UserRepository(dbContext)
  );
  container.register(
    'userStateRepository',
    (dbContext: IMongoDbContext): IUserStateRepository =>
      new UserStateRepository(dbContext)
  );
  container.register(
    'userPermissionsRepository',
    (dbContext: IMongoDbContext): IUserPermissionsRepository =>
      new UserPermissionsRepository(dbContext)
  );

  return new Promise<void>((resolve) => {
    // TODO repository/configService will be removed once we won't crank up the DB
    container.resolve((repository, configService, dbContext: IMongoDbContext) => {
      dbContext.once('db.ready', () => resolve());
    });
  });
}
