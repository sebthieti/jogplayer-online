import * as Rx from 'rx';
import {AuthenticationStatus} from '../constants';
import {InsertUserWithPermissions, UpsertUser, User} from '../entities/user';
import UserPermissionsModel from './userPermissions.model';
import {UserStateModel} from './userState.model';
import {UserRepository} from '../repositories/user.repository';
import PlaylistCollection from './playlist.collection';

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

  // private authenticationStatusSubject = new Rx.BehaviorSubject(AuthenticationStatus.Undetermined);
  // private currentUserAuthSubject = new Rx.BehaviorSubject<UserModel>(null);

  constructor(private repository: UserRepository, user?: User) {
    this.setFromEntity(user);
    // this.verifyCurrentUser();
    // this.observeOnUnauthorizedInvalidateUser();
  }

  async changePassword(newPassword: string): Promise<UserModel> {
    const updatedUser = await this.repository.update(this.id, {
      password: newPassword
    });
    this.setFromEntity(updatedUser);

    return this;
  }

  async update(): Promise<UserModel> {
    const updatedUser = await this.repository.update(
      this.id,
      this.toUpsertRequest()
    );
    this.setFromEntity(updatedUser);

    return this;
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

  // observeAuthenticationStatus() {
  //   return this.authenticationStatusSubject;
  // }
  //
  // observeCurrentUserAuthentication() {
  //   return this.currentUserAuthSubject.filter(x => x !== null);
  // }
  //
  // observeAuthenticatedUser() {
  //   return this.currentUserAuthSubject.filter(x => !!x);
  // }

  // async login(username: string, password: string): Promise<void> {
  //   this.authenticationStatusSubject.onNext(AuthenticationStatus.LoggingIn);
  //
  //   try {
  //     const user = await this.repository.login(username, password);
  //     this.setFromEntity(user);
  //
  //     this.authenticationStatusSubject.onNext(AuthenticationStatus.LoggedIn);
  //     this.currentUserAuthSubject.onNext(this);
  //   } catch (err) { // TODO May be another error than 401
  //     this.authenticationStatusSubject.onNext(AuthenticationStatus.InvalidCredentials);
  //   }
  // }
  //
  // async logout(): Promise<void> {
  //   await this.repository.logout();
  //   this.currentUserAuthSubject.onNext(null);
  // }

  // private async verifyCurrentUser(): Promise<void> {
  //   try {
  //     await this.repository.isAuthenticated();
  //     this.currentUserAuthSubject.onNext(this);
  //   } catch (err) {
  //     this.currentUserAuthSubject.onNext(null);
  //     this.authenticationStatusSubject.onNext(AuthenticationStatus.InvalidCredentials);
  //   }
  // }

  // TODO Interceptor pattern
  // private isUnauthorized(error) {
  //   return error.status === 401;
  // }

  // private observeOnUnauthorizedInvalidateUser() {
    // serviceFactory
    //   .observeError()
    //   .where(isUnauthorized)
    //   .do(function() {
    //     currentUserAuthSubject.onNext(null);
    //     authenticationStatusSubject.onNext(JpoAuthenticationStatus.SessionExpired);
    //   })
    //   .silentSubscribe();
  // }

  setFromEntity(user?: User): UserModel {
    user && Object.assign(this, {
      id: user.id,
      isActive: user.isActive,
      username: user.username,
      fullName: user.fullName,
      email: user.email
    });

    this.takeSnapshot();

    if (!this.permissions) {
      this.permissions = new UserPermissionsModel(
        this.repository,
        this,
        user && user.permissions
      );
    } else {
      this.permissions.setFromEntity(user && user.permissions)
    }

    return this;
  }
}
