import {UpsertUserRequest} from "../requests/upsertUser.request";
import UserModel, {IUserModel} from "../models/user.model";
import {UpdatePermissionsRequest} from '../requests/updatePermissions.request';
import {IMediaRepository} from '../repositories/media.repository';
import {IPlaylistService} from '../services/m3uPlaylist.service';
import {IPlaylistRepository} from '../repositories/playlist.repository';
import {IMediaService} from '../services/media.service';
import {IFileExplorerService} from '../services/fileExplorers/fileExplorer.service';
import {IUserRepository} from '../repositories/user.repository';
import {IUserCache} from '../cache/user.cache';
import {IFavoriteRepository} from '../repositories/favorite.repository';
import {IUserPermissionsRepository} from '../repositories/userPermissions.repository';
import {IUserStateRepository} from '../repositories/userState.repository';
import {User} from '../entities/user';
import {ObjectID} from 'mongodb';

export interface IUserDirector {
  isRootUserSetAsync(): Promise<boolean>;
  getUsersAsync(issuer: IUserModel): Promise<IUserModel[]>;
  getUserByIdAsync(userId: string): Promise<IUserModel>;
  getUserByUsernameAsync(username: string): Promise<IUserModel>;
  addRootUserAsync(userRequest: UpsertUserRequest): Promise<IUserModel>;
  addUserWithDefaultPermissionsAsync(
    userRequest: UpsertUserRequest,
    userPermissionsRequest: UpdatePermissionsRequest,
    issuer: IUserModel): Promise<IUserModel>;
  updateUserAsync(
    userId: string,
    userRequest: UpsertUserRequest,
    issuer: IUserModel): Promise<IUserModel>;
  removeUserByIdAsync(userId: string, issuer: IUserModel): Promise<void>;
}

export default class UserDirector implements IUserDirector {
  constructor(
    private userRepository: IUserRepository,
    private playlistService: IPlaylistService,
    private mediaRepository: IMediaRepository,
    private playlistRepository: IPlaylistRepository,
    private mediaService: IMediaService,
    private fileExplorerService: IFileExplorerService,
    private favoriteRepository: IFavoriteRepository,
    private userPermissionsRepository: IUserPermissionsRepository,
    private userStateRepository: IUserStateRepository,
    private userCache: IUserCache
  ) {
  }

  isRootUserSetAsync(): Promise<boolean> {
    return this.userRepository.isRootUserSetAsync();
  }

// TODO Check for rights before doing (directory should do not service layer)
  async getUsersAsync(issuer: IUserModel): Promise<IUserModel[]> {
    if (!issuer.permissions.isRoot && !issuer.permissions.isAdmin) {
      throw new Error('Not authorized to manage users.');
    }
    const users = await this.userRepository.getUsersAsync();
    return users.map(user => this.buildUserModel(user))
  }

  async getUserByIdAsync(userId: string): Promise<IUserModel> {
    return this.userCache.getUserByIdAsync(
      userId,
      async (id: string) => {
        const user = await this.userRepository.getUserByIdAsync(new ObjectID(id));
        return this.buildUserModel(user);
      }
    );
  }

  getUserByUsernameAsync(username: string): Promise<IUserModel> {
    return this.userCache.getUserByUsernameAsync(
      username,
      async (name: string) => {
        const user = await this.userRepository.getUserByUsernameAsync(name);
        return this.buildUserModel(user);
      }
    );
  }

  async addRootUserAsync(userRequest: UpsertUserRequest): Promise<IUserModel> {
    // TODO Add safety to prevent 2x root users
    const rootUser = this.buildUserModel()
      .updateFromRequest(userRequest)
      .setPassword(userRequest.password)
      .setRootUser()
      .setIsActive();

    const user = await this.userRepository.addUserAsync(rootUser.toEntityWithPermissions());
    rootUser.updateFromEntity(user);

    return this.userCache.registerUser(rootUser);
  }

  async addUserWithDefaultPermissionsAsync(
    userRequest: UpsertUserRequest,
    userPermissionsRequest: UpdatePermissionsRequest,
    issuer: IUserModel
  ): Promise<IUserModel> {
    if (!issuer.permissions.isRoot && !issuer.permissions.isAdmin) { // TODO Use role or isAdmin ? There is redundancy
      throw new Error('Not authorized to manage users.');
    }

    const userModel = this.buildUserModel()
      .updateFromRequest(userRequest)
      .setPassword(userRequest.password);
    userModel.permissions.buildFromRequest(userPermissionsRequest);

    const user = await this.userRepository.addUserAsync(userModel.toEntityWithPermissions());
    userModel.updateFromEntity(user);

    return this.userCache.registerUser(userModel);
  }

  async updateUserAsync(
    userId: string,
    userRequest: UpsertUserRequest,
    issuer: IUserModel
  ): Promise<IUserModel> {
    if (!issuer.permissions.isRoot && !issuer.permissions.isAdmin) {
      throw new Error('Not authorized to manage users.');
    }

    let user = issuer.updateFromRequest(userRequest).toEntity();
    user = await this.userRepository.updateUserAsync(issuer._id, user);
    issuer.updateFromEntity(user);

    return issuer;
  }

  async removeUserByIdAsync(userId: string, issuer: IUserModel): Promise<void> {
    if (!issuer.permissions.isRoot && !issuer.permissions.isAdmin) {
      throw new Error('Not authorized to manage users.');
    }
    if (issuer.id === userId) {
      throw new Error('Cannot remove yourself.');
    }

    const user = await this.userRepository.getUserByIdAsync(new ObjectID(userId));
    if (!user) {
      return;
    }

    if (user.permissions.isRoot) {
      throw new Error('Root user cannot be removed.');
    }

    await this.userRepository.removeUserByIdAsync(user._id);
    await this.userCache.removeUserByIdAsync(issuer.id);
  }

  private buildUserModel(user?: User): IUserModel {
    return new UserModel(
      this.playlistService,
      this.mediaRepository,
      this.playlistRepository,
      this.mediaService,
      this.fileExplorerService,
      this.favoriteRepository,
      this.userPermissionsRepository,
      this.userStateRepository,
      user
    );
  }
}
