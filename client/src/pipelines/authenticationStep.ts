import {autoinject} from 'aurelia-framework';
import {NavigationInstruction, Next, PipelineStep, Redirect} from 'aurelia-router';
import AuthenticationService from '../services/authentication.service';
import {AuthenticationStatus} from '../constants';
import {UserRepository} from '../repositories/user.repository';

@autoinject
export class AuthenticationStep implements PipelineStep {
  constructor(
    private userRepository: UserRepository,
    private authenticationService: AuthenticationService
  ) { }

  async run(navigationInstruction: NavigationInstruction, next: Next): Promise<any> {
    if (navigationInstruction.getAllInstructions().some(i => i.config.settings.auth)) {
      let isLoggedIn = this.authenticationService
        .observeAuthenticationStatus()
        .getValue() === AuthenticationStatus.LoggedIn;
      if (isLoggedIn) {
        return next();
      }

      try {
        await this.userRepository.isAuthenticated();
      } catch (err) {
        return next.cancel(new Redirect('login'))
      }
    }

    return next();
  }
}
