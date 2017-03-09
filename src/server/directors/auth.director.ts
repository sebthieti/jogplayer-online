import * as hasher from '../utils/hasher';
import {IUserProxy} from '../proxies/user.proxy';
import {User} from '../models/user.model';
import Request = e.Request;

export interface IAuthDirector {
  verifyUser(username, password, next);
  getUserByUsernameAsync(username);
  serializeUser(user, next);
  deserializeUser(username, next);
  ensureApiAuthenticated(req, res, next);
}

export default class AuthDirector implements IAuthDirector {
  constructor(private userProxy: IUserProxy) {
  }

  /**
   * @description
   *
   * Verify user credentials with given username and password. Provide a callback to retrieve response.
   * Response: (null, user|false, { message })
   *
   * @param {string} username User name to check for.
   * @param {string} password Password to check for.
   * @param {function} next A callback to be called to received response for check.
   */
  async verifyUser(username: string, password: string, next: (p1: any, p2?: any, p3?: any) => void) {
    try {
      const user = await this.userProxy.getUserByUsernameWithPermissionsAsync(username);
      if (user === null) {
        next(null, false, {message: 'Invalid credentials.'});
        return;
      }
      const hashedPassword = hasher.computeHash(password, user.passwordSalt);
      if (user.password === hashedPassword) {
        next(null, user);
      } else {
        next(null, false, {message: 'Invalid credentials.'});
      }
    } catch (err) {
      next(err);
    }
  }

  /**
   * @description
   *
   * Retrieve user from cache by its username.
   *
   * @param {string} username User name to get user for.
   *
   * @returns {Promise} A promise returning an user
   */
  getUserByUsernameAsync(username: string): Promise<User> {
    return this.userProxy.getUserByUsernameWithPermissionsAsync(username);
  }

  serializeUser(user: User, next: (p1: any, p2?: any, p3?: any) => void) {
    next(null, user.username);
  }

  deserializeUser(username: string, next: (p1: any, p2?: any, p3?: any) => void) {
    this.getUserByUsernameAsync(username) // TODO Really need of cache to avoid excessive queries
      .then(user => {
        next(null, user);
      }, err => {
        next(err, false, {message: err});
      });
  };

  ensureApiAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
      next();
    } else {
      res.sendStatus(401);
    }
  }
}
