import * as express from 'express';
import * as passport from 'passport';
import * as passportLocal from 'passport-local';
const LocalStategy = passportLocal.Strategy;

import {IAuthDirector} from '../directors/auth.director';
import {IMediaDirector} from '../directors/media.director';
import {IMediaStreamer} from '../stream/mediaStreamer';
import {IPlaylistDirector} from '../directors/playlist.director';
import {IPlaylistsDirector} from '../directors/playlists.director';
import {IConfigDirector} from '../directors/config.director';
import {IFileExplorerDirector} from '../directors/fileExplorer.director';
import {IFavoriteDirector} from '../directors/favorite.director';
import {IUserDirector} from '../directors/user.director';
import {IUserStateDirector} from '../directors/userState.director';
import {IRouter} from './router';

import PlaylistRouter from './playlist.router';
import FileExplorerRouter from './fileExplorer.router';
import FavoriteRouter from './favorite.router';
import AuthRouter from './auth.router';
import UserRouter from './user.router';
import UserStateRouter from './userState.router';
import HomeRouter from './home.router';
import MediaRouter from './media.router';
import SetupRouter from './setup.router';
import {IUserPermissionsDirector} from '../directors/userPermissions.director';
import {IUserModel} from '../models/user.model';

/**
 * @description
 *
 * Register the controller layer (also referred as router) components in IoC
 *
 * @param {object} app The application object..
 */
export default function register(container: any, app: express.Application) {
  container.register('mediaRouter', (
    authDirector: IAuthDirector,
    mediaDirector: IMediaDirector,
    mediaStreamer: IMediaStreamer
  ): IRouter => new MediaRouter(
    app,
    authDirector,
    mediaDirector,
    mediaStreamer
  ));
  container.register('playlistRouter', (
    authDirector: IAuthDirector,
    playlistDirector: IPlaylistDirector,
    playlistsDirector: IPlaylistsDirector
  ): IRouter => new PlaylistRouter(
    app,
    authDirector,
    playlistDirector,
    playlistsDirector
  ));
  container.register('fileExplorerRouter', (
    authDirector: IAuthDirector,
    fileExplorerDirector: IFileExplorerDirector
  ): IRouter => new FileExplorerRouter(
    app,
    authDirector,
    fileExplorerDirector
  ));
  container.register('favoriteRouter', (
    authDirector: IAuthDirector,
    favoriteDirector: IFavoriteDirector
  ): IRouter => new FavoriteRouter(
    app,
    authDirector,
    favoriteDirector
  ));
  container.register('authRouter', (
    authDirector: IAuthDirector
  ): IRouter => new AuthRouter(
    app,
    authDirector
  ));
  container.register('userRouter', (
    authDirector: IAuthDirector,
    userDirector: IUserDirector,
    permissionsDirector: IUserPermissionsDirector
  ): IRouter => new UserRouter(
    app,
    authDirector,
    userDirector,
    permissionsDirector
  ));
  container.register('userStateRouter', (
    authDirector: IAuthDirector,
    userStateDirector: IUserStateDirector
  ): IRouter => new UserStateRouter(
    app,
    authDirector,
    userStateDirector
  ));
  container.register('homeRouter', (
    configDirector: IConfigDirector
  ): IRouter => new HomeRouter(
    app,
    configDirector
  ));
  container.register('setupRouter', (
    userDirector: IUserDirector
  ): IRouter => new SetupRouter(
    app,
    userDirector
  ));
}

export function postRegisterAuthenticationStack(container: any, app: express.Application) {
  // Must be executed before any http request
  container.resolve((authDirector: IAuthDirector) => {
    passport.use(new LocalStategy(authDirector.verifyUser.bind(authDirector)));
    passport.serializeUser((user: IUserModel, next) => {
      authDirector.serializeUser(user, next);
    });
    passport.deserializeUser((username: string, next) => {
      authDirector.deserializeUser(username, next);
    });
  });
}
