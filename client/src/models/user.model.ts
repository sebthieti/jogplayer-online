import {InsertUserWithPermissions, NewUser, UpsertUser, User} from '../entities/user';
import UserPermissionsModel from './userPermissions.model';
import {UserStateModel} from './userState.model';
import PlaylistCollection from './playlist.collection';
import UserService from '../services/user.service';

interface UserModelSnapshot {
  fullName?: string;
  email?: string;
  isActive?: boolean;
  username?: string;
}

export default class UserModel {
  id: string;
  isActive: boolean;
  username: string;
  fullName: string;
  email: string;
  playlists: PlaylistCollection;
  permissions: UserPermissionsModel;
  state: UserStateModel;

  private previousSnapshot: UserModelSnapshot;

  constructor(protected service: UserService, user?: User|NewUser) {
    this.setFromEntity(user);
  }

  setFromEntity(user?: User|NewUser): UserModel {
    if (user) {
      Object.assign(this, {
        isActive: user.isActive,
        username: user.username,
        fullName: user.fullName,
        email: user.email
      });
      if (this.isUserEntity(user)) {
        this.id = user.id;
      }
    }

    this.takeSnapshot();

    if (!this.permissions) {
      this.permissions = new UserPermissionsModel(
        this.service,
        this,
        user && user.permissions
      );
    } else {
      this.permissions.setFromEntity(user && user.permissions)
    }

    return this;
  }

  private isUserEntity(user: User|NewUser): user is User {
    return 'id' in user;
  }

  private isNewUserEntity(user: User|NewUser): user is NewUser {
    return !('id' in user);
  }

  get isNewUser(): boolean {
    return !this.id;
  }

  get isExistingUser(): boolean {
    return !!this.id;
  }

  private takeSnapshot(): void {
    this.previousSnapshot = {
      fullName: this.fullName,
      email: this.email,
      isActive: this.isActive,
      username: this.username
    };
  }

  toUpsertRequest(): UpsertUser {
    let update = {} as UpsertUser;

    if (this.fullName !== this.previousSnapshot.fullName) {
      update.fullName = this.fullName;
    } if (this.email !== this.previousSnapshot.email) {
      update.email = this.email;
    } if (this.isActive !== this.previousSnapshot.isActive) {
      update.isActive = this.isActive;
    } if (this.username !== this.previousSnapshot.username) {
      update.username = this.username;
    }

    return update;
  }

  toInsertUserRequest(password: string): InsertUserWithPermissions {
    let insert = {
      username: this.username,
      password: password,
      permissions: this.permissions.toUpdateRequest()
    } as InsertUserWithPermissions;

    if (this.fullName !== this.previousSnapshot.fullName) {
      insert.fullName = this.fullName;
    } if (this.email !== this.previousSnapshot.email) {
      insert.email = this.email;
    } if (this.isActive !== this.previousSnapshot.isActive) {
      insert.isActive = this.isActive;
    } if (this.username !== this.previousSnapshot.username) {
      insert.username = this.username;
    }

    return insert;
  }
}
