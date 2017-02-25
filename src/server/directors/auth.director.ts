import * as hasher from '../utils/hasher';
import {IUserProxy} from '../proxies/user.proxy';

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
  verifyUser(username, password, next) {
    this.userProxy
      .getUserByUsernameWithPermissionsAsync(username)
      .then(user => {
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
      }, err => {
        next(err);
      });
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
  getUserByUsernameAsync(username) {
    return this.userProxy.getUserByUsernameWithPermissionsAsync(username);
  }

  serializeUser(user, next) {
    next(null, user.username);
  }

  deserializeUser(username, next) {
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
