import {autoinject, computedFrom} from 'aurelia-framework';
import {Router} from 'aurelia-router';
import {AuthenticationStatus} from './constants';
import AuthenticationService from './services/authentication.service';

@autoinject
export class Login {
  logonStatus = AuthenticationStatus.Undetermined;
  showWelcome = true;
  showLoginForm = false;
  username: string;
  password: string;

  constructor(
    private authenticationService: AuthenticationService,
    private router: Router
  ) {}

  @computedFrom('username', 'password')
  get canSubmit(): boolean {
    return this.username && this.username !== '' &&
      this.password && this.password !== '';
  }

  async submitCredentials() {
    await this.authenticationService.login(this.username, this.password);
    this.router.navigateToRoute('home');
  }
}
