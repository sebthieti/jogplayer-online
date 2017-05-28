import routes from '../routes';
import * as hasher from '../utils/hasher';

import UserPermissionsModel, {IUserPermissionsModel} from './userPermissions.model';
import {User} from '../entities/user';
import {ObjectID} from 'mongodb';
import {IUserStateModel, UserStateModel} from './userState.model';
import {IPlaylistModel} from './playlist.model';
import {IModel} from "./model";
import {UpsertUserRequest} from "../requests/upsertUser.request";
import {Link} from '../entities/link';
import {UpsertPlaylistRequest} from '../requests/updatePlaylist.request';
import PlaylistCollection, {IPlaylistCollection} from './playlist.collection';
import {IFileExplorerService} from '../services/fileExplorers/fileExplorer.service';
import {IMediaService} from '../services/media.service';
import {IPlaylistRepository} from '../repositories/playlist.repository';
import {IMediaRepository} from '../repositories/media.repository';
import {IPlaylistService} from '../services/m3uPlaylist.service';
import {IMediumModel} from './medium.model';
import {IFavoriteRepository} from '../repositories/favorite.repository';
import FavoriteCollection, {IFavoriteCollection} from './favorite.collection';
import {IUserPermissionsRepository} from '../repositories/userPermissions.repository';
import {IUserStateRepository} from '../repositories/userState.repository';

export interface IUserModel extends IModel<User> {
  _id: ObjectID;
  id: string;
  isActive: boolean;
  isRoot: boolean;
  username: string;
  hashedPassword: string;
  passwordSalt: string;
  fullName: string;
  role: string;
  email: string;
  favorites: IFavoriteCollection;
  permissions: IUserPermissionsModel;
  state: IUserStateModel;
  playlists: IPlaylistCollection;
  links: Link[];
  searchMediumByIdAsync(mediumId: string): IMediumModel;
  doesPasswordMatchWith(pwd: string): boolean;
  setPassword(password: string): IUserModel;
  setRootUser(): IUserModel;
  setIsActive(): IUserModel;
  updateFromRequest(userRequest: UpsertUserRequest): IUserModel;
  updatePlaylistFromRequest(playlistIndex: number, playlistRequest: UpsertPlaylistRequest): IPlaylistModel;
  updateFromEntity(user: User): IUserModel;
  toEntityWithPermissions(): User;
}

export default class UserModel implements IUserModel {
  _id: ObjectID;
  isActive: boolean;
  isRoot: boolean;
  username: string;
  hashedPassword: string;
  passwordSalt: string;
  fullName: string;
  role: string;
  email: string;
  favorites: IFavoriteCollection;
  permissions: IUserPermissionsModel;
  state: IUserStateModel;
  playlists: IPlaylistCollection;

  constructor(
    playlistService: IPlaylistService,
    mediaRepository: IMediaRepository,
    playlistRepository: IPlaylistRepository,
    mediaService: IMediaService,
    fileExplorerService: IFileExplorerService,
    favoriteRepository: IFavoriteRepository,
    userPermissionsRepository: IUserPermissionsRepository,
    userStateRepository: IUserStateRepository,
    user?: User
  ) {
    this.setFromEntity(user);
    this.favorites = new FavoriteCollection(
      favoriteRepository,
      this,
      user && user.favorites
    );
    this.permissions = new UserPermissionsModel(
      this,
      userPermissionsRepository,
      user && user.permissions
    );
    this.state = new UserStateModel(
      userStateRepository,
      this,
      user && user.state
    );
    this.playlists = new PlaylistCollection(
      this,
      playlistService,
      mediaRepository,
      playlistRepository,
      mediaService,
      fileExplorerService,
      user && user.playlists
    );
  }

  updateFromEntity(user: User): IUserModel {
    return this.setFromEntity(user);
  }

  private setFromEntity(user: User): IUserModel { // TODO This cause update to password, but we also call setPassword after
    this._id = user && user._id;
    this.isActive = user && user.isActive;
    // this.isRoot = user && user.isRoot;
    this.username = user && user.username;
    this.hashedPassword = user && user.hashedPassword;
    this.passwordSalt = user && user.passwordSalt;
    this.fullName = user && user.fullName;
    this.role = user && user.role;
    this.email = user && user.email;
    // TODO Also update permissions...
    return this;
  }

  searchMediumByIdAsync(mediumId: string): IMediumModel {
    return this.playlists.findLoadedMediumById(mediumId);// ||
      // this.state.findLoadedMediumByPath(mediumId);
  }

  get id(): string {
    return this._id.toString();
  }

  doesPasswordMatchWith(pwd: string): boolean {
    const hashedPassword = hasher.computeHash(pwd, this.passwordSalt);
    return this.hashedPassword === hashedPassword
  }

  setPassword(password: string): IUserModel {
    // Generate hashedPassword salt
    this.passwordSalt = hasher.createSalt();
    this.hashedPassword = hasher.computeHash(password, this.passwordSalt); // TODO Rename in model to hashedPassword

    return this;
  }

  setRootUser(): IUserModel {
    this.permissions.setIsRoot().setIsAdmin();
    return this;
  }

  setIsActive(): IUserModel {
    this.isActive = true;
    return this;
  }

  updateFromRequest(request: UpsertUserRequest): IUserModel {
    Object.assign(this, request);
    return this;
  }

  updatePlaylistFromRequest(playlistIndex: number, playlistRequest: UpsertPlaylistRequest): IPlaylistModel {
    return this.playlists[playlistIndex].updateFromRequestAsync(playlistRequest);;
  }

  get links(): Link[] {
    return [{
      rel: 'self',
      href: routes.users.selfPath.replace(':userId', this.id)
    }/*, {
     rel: 'self.permissions',
     href: _userRoutes.selfPermissionsPath.replace(':userId', this.id)
     }*/, {
      rel: 'update',
      href: routes.users.updatePath.replace(':userId', this.id)
    }, {
      rel: 'remove',
      href: routes.users.deletePath.replace(':userId', this.id)
    }];
  }

  toEntity(): User {
    return {
      _id: this._id,
      username: this.username,
      fullName: this.fullName,
      email: this.email,
      hashedPassword: this.hashedPassword,
      passwordSalt: this.passwordSalt,
      isActive: this.isActive,
      role: this.role,
      favorites: this.favorites.toEntity(),
      playlists: this.playlists.toEntity(),
      state: this.state.toEntity()
    };
  }

  toEntityWithPermissions(): User {
    return {
      _id: this._id,
      username: this.username,
      fullName: this.fullName,
      email: this.email,
      hashedPassword: this.hashedPassword,
      passwordSalt: this.passwordSalt,
      isActive: this.isActive,
      role: this.role,
      permissions: this.permissions.toEntity(),
      favorites: this.favorites.toEntity(),
      playlists: this.playlists.toEntity(),
      state: this.state.toEntity()
    };
  }
}
