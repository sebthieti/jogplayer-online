import {autoinject} from 'aurelia-framework';
import {Router} from 'aurelia-router';
import {UserRepository} from '../repositories/user.repository';

@autoinject
export default class UnauthorizedRedirectorService {
  constructor(private userRepository: UserRepository, private router: Router) {
  }

  init() {
    this.userRepository
      .observeUnauthorizedError()
      .do(_ => this.router.navigate('login'))
      .subscribe();
  }
}
