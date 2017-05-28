import {autoinject} from 'aurelia-framework';
import { BehaviorSubject, Observable } from 'rx';
import {UserRepository} from '../repositories/user.repository';
import {AuthenticationStatus} from '../constants';
import UserModel from '../models/user.model';
import UserService from './user.service';

@autoinject
export default class AuthenticationService {
  private authenticationStatusSubject = new BehaviorSubject<string>(AuthenticationStatus.Undetermined);
  private currentUserAuthSubject = new BehaviorSubject<UserModel>(null);

  constructor(
    private userRepository: UserRepository,
    private userService: UserService
  ) {
    this.verifyCurrentUser();
  }

  observeAuthenticationStatus(): BehaviorSubject<string> {
    return this.authenticationStatusSubject;
  }

  observeCurrentUserAuthentication(): Observable<UserModel> {
    return this.currentUserAuthSubject.whereIsDefined();
  }

  observeAuthenticatedUser(): Observable<UserModel> {
    return this.currentUserAuthSubject.whereHasValue();
  }

  getActiveUser(): UserModel {
    return this.currentUserAuthSubject.getValue();
  }

  async login(username: string, password: string): Promise<UserModel> {
    this.authenticationStatusSubject.onNext(AuthenticationStatus.LoggingIn);

    try {
      const user = await this.userRepository.login(username, password);
      const model = new UserModel(this.userService, user);

      this.authenticationStatusSubject.onNext(AuthenticationStatus.LoggedIn);
      this.currentUserAuthSubject.onNext(model);
      return model;
    } catch (err) { // TODO May be another error than 401
      this.authenticationStatusSubject.onNext(AuthenticationStatus.InvalidCredentials);
    }
  }

  async logout(): Promise<void> {
    await this.userRepository.logout();
    this.currentUserAuthSubject.onNext(null);
  }

  private async verifyCurrentUser(): Promise<void> {
    try {
      const user = await this.userRepository.isAuthenticated();
      const model = new UserModel(this.userService, user);
      this.currentUserAuthSubject.onNext(model);
    } catch (err) {
      this.currentUserAuthSubject.onNext(null);
      this.authenticationStatusSubject.onNext(AuthenticationStatus.InvalidCredentials);
    }
  }
}
