import {autoinject} from 'aurelia-framework';
import {CssAnimator} from 'aurelia-animator-css';
import {AuthenticationStatus} from '../../constants';

@autoinject
export class shakeOnInvalidCredentialsCustomAttribute {
  private logonStatus: string;

  constructor(private animator: CssAnimator, private element: Element) {
  }

  valueChanged(logonStatus: string) {
    this.logonStatus = logonStatus;
  }

  async attached() {
    switch (this.logonStatus) {
      case AuthenticationStatus.LoggedIn:
        return this.animator.removeClass(this.element, 'shake');
      case AuthenticationStatus.InvalidCredentials:
        await this.animator.addClass(this.element, 'shake');
        await this.animator.removeClass(this.element, 'shake');
    }
  }
}
