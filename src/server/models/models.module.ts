import favoriteModel from './favorite.model';
import mediaModel from  './media.model';
import playlistModel from './playlist.model';
import userModel from './user.model';
import userStateModel from './userState.model';
import userPermissionsModel from './userPermissions.model';
import {IFavoriteModel} from './favorite.model';
import {IMediaModel} from './media.model';
import {IPlaylistModel} from './playlist.model';
import {IUserModel} from './user.model';
import {IUserStateModel} from './userState.model';
import {IUserPermissionsModel} from './userPermissions.model';

/**
 * @description
 *
 * Register a Models object containing all Models serves by the app, to IoC
 */
export default function bootstrap(container: any) {
  container.register('favoriteModel', (): IFavoriteModel => favoriteModel);
  container.register('mediaModel', (): IMediaModel => mediaModel);
  container.register('playlistModel', (): IPlaylistModel => playlistModel);
  container.register('userModel', (): IUserModel => userModel);
  container.register('userStateModel', (): IUserStateModel => userStateModel);
  container.register('userPermissionsModel', (): IUserPermissionsModel => userPermissionsModel);
}
