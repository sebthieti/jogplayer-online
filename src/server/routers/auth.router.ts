import * as passport from 'passport';
import * as express from 'express';
import routes from '../routes';
import {IAuthDirector} from '../directors/auth.director';
import {IRouter} from './router';
import {IUserModel} from '../models/user.model';
import toUserDto from '../mappers/user.mapper';

export default class AuthRouter implements IRouter {
  constructor(private app: express.Application, private authDirector: IAuthDirector) {
  }

  bootstrap() {
    this.app.post(routes.login.postPath, passport.authenticate('local'), (req, res) => {
      const user = req.user as IUserModel;
      res.status(200).send(toUserDto(user));
    });

    this.app.post(routes.logout.postPath, (req, res) => {
      req.logout();
      res.status(200).send({message: 'Logged out'});
    });

    this.app.get(routes.isAuthenticated.getPath, this.authDirector.ensureApiAuthenticated, (req, res) => {
      const user = req.user as IUserModel;
      res.status(200).send(toUserDto(user));
    });
  }
}
