import {autoinject} from 'aurelia-framework';
import AuthenticationService from './services/authentication.service';
import UserStateService from './services/userState.service';
import AudioService from './services/audio.service';
import MediaQueueService from './services/mediaQueue.service';
import PlaylistService from './services/playlist.service';
import {ConfiguresRouter, RouteConfig, Router, RouterConfiguration} from 'aurelia-router';

@autoinject
export class Home implements ConfiguresRouter {
  settings: any;
  currentUser: any = null;
  isAdmin = false;
  canShowMenu = false;
  canShowMediaQueue = false;
  manageUserVisible = false;

  constructor(
    private authenticationService: AuthenticationService,
    private userStateService: UserStateService,
    private mediaQueueService: MediaQueueService,
    private playlistService: PlaylistService,
    private audioService: AudioService,
    private router: Router
  ) { }

  configureRouter(config: RouterConfiguration, router: Router): void {
    config.map([
      {
        route: '',
        name: 'home',
        moduleId: 'home',
        viewPorts: {
          mediaQueue: {moduleId: 'views/main/parts/mediaQueue'},
          audioControls: {moduleId: 'views/main/parts/audioControls'},
          manageUsers: {moduleId: 'views/main/parts/manageUsers'},
          playlistExplorer: {moduleId: 'views/main/parts/playlistExplorer'},
          controlBar: {moduleId: 'views/main/parts/controlBar'},
          fileExplorer: {moduleId: 'views/main/parts/fileExplorer'},
          favoritesExplorer: {moduleId: 'views/main/parts/favoritesExplorer'}
        },
        settings: {auth: true},
      }
    ]);
  }

  activate(params: any, routeConfig: RouteConfig) {
    this.audioService
      .observePlayingMedium()
      .filter(x => !!x)
      .startWith(null)
      .do(medium => {
        if (!medium) {
          routeConfig.navModel.setTitle('JogPlayer Online');
        } else {
          const nameOrTitle = medium.title || medium.name;
          routeConfig.navModel.setTitle(`${nameOrTitle} - JogPlayer Online`);
        }
      })
      .subscribe();
  }

  bind() {
    this.authenticationService
      .observeAuthenticatedUser()
      .do(user => {
        this.currentUser = user;
        this.canShowMenu = !!user;
        this.canShowMediaQueue = this.canShowMenu;
        if (!user) {
          this.manageUserVisible = false;
        } else {
          this.isAdmin = user.permissions.isAdmin || user.permissions.isRoot;
        }
      })
      .subscribe();
  }

  attached() {
    this.audioService.init('audioPlayer');
    this.mediaQueueService.init();
    this.playlistService.init();
    this.userStateService.init();
  }

  deactivate() {
    // TODO Dispose all Rx
  }

  toggleUserManager() {
    this.manageUserVisible = !this.manageUserVisible;
  }

  async logout() {
    await this.authenticationService.logout();
    this.router.navigate('login');
  }
}
