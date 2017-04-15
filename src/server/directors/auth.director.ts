import {IUserModel} from '../models/user.model';
import {IUserDirector} from './user.director';

export interface IAuthDirector {
  verifyUser(username: string, password: string, next: (p1: any, p2?: any, p3?: any) => void);
  getUserByUsernameAsync(username: string): Promise<IUserModel>;
  serializeUser(user: IUserModel, next: (p1: any, p2?: any, p3?: any) => void);
  deserializeUser(username: string, next: (p1: any, p2?: any, p3?: any) => void);
  ensureApiAuthenticated(req, res, next);
}

export default class AuthDirector implements IAuthDirector {
  constructor(private userDirector: IUserDirector) {
  }

  /**
   * @description
   *
   * Verify user credentials with given username and hashedPassword. Provide a callback to retrieve response.
   * Response: (null, user|false, { message })
   *
   * @param {string} username User name to check for.
   * @param {string} password Password to check for.
   * @param {function} next A callback to be called to received response for check.
   */
  async verifyUser(username: string, password: string, next: (p1: any, p2?: any, p3?: any) => void) {
    try {
      const user = await this.userDirector.getUserByUsernameAsync(username);
      if (user === null) {
        next(null, false, {message: 'Invalid credentials.'});
        return;
      }
      if (user.doesPasswordMatchWith(password)) {
        next(null, user);
      } else {
        next(null, false, {message: 'Invalid credentials.'});
      }
    } catch (err) {
      next(err);
    }
  }

  serializeUser(user: IUserModel, next: (p1: any, p2?: any, p3?: any) => void) {
    next(null, user.username);
  }

  async deserializeUser(username: string, next: (p1: any, p2?: any, p3?: any) => void) {
    try {
      const user = await this.getUserByUsernameAsync(username);
      next(null, user);
    } catch (err) {
      next(err, false, {message: err});
    }
  };

  /**
   * @description
   *
   * Retrieve user from cache by its username.
   *
   * @param {string} username User name to get user for.
   *
   * @returns {Promise} A promise returning an user
   */
  getUserByUsernameAsync(username: string): Promise<IUserModel> {
    return this.userDirector.getUserByUsernameAsync(username);
  }

  ensureApiAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
      next();
    } else {
      res.sendStatus(401);
    }
  }
}
