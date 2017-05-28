import {autoinject} from 'aurelia-framework';
import {ConfiguresRouter, Router, RouterConfiguration} from 'aurelia-router';
import {AuthorizeStep} from './pipelines/authorizeStep';
import UnauthorizedRedirectorService from './services/unauthorizedRedirector.service';

@autoinject
export class App implements ConfiguresRouter {
  private router: Router;

  constructor(private unauthorizedRedirectorService: UnauthorizedRedirectorService) {
  }

  configureRouter(config: RouterConfiguration, router: Router): void {
    this.router = router;
    config.title = 'JogPlayer Online';
    config.addAuthorizeStep(AuthorizeStep);
    config.map([
      {
        route: ['', 'home'],
        name: 'home',
        moduleId: 'home',
        nav: true,
        settings: { auth: true },
      },
      {
        route: 'login',
        name: 'login',
        moduleId: 'login'
      },
      {
        route: 'setup',
        name: 'setup',
        moduleId: 'setup'
      }
    ]);
  }

  created() {
    this.unauthorizedRedirectorService.init();
  }
}
