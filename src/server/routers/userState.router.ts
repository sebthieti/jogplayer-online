import * as express from 'express';
import routes from '../routes';
import {IRouter} from './router';
import {IAuthDirector} from '../directors/auth.director';
import {IUserStateDirector} from '../directors/userState.director';
import UserStateValidator from '../validators/userState.validator';
import {IUserModel} from '../models/user.model';
import toUserStateDto from '../mappers/userState.mapper';

export default class UserStateRouter implements IRouter {
  constructor(
    private app: express.Application,
    private authDirector: IAuthDirector,
    private userStateDirector: IUserStateDirector
  ) {}

  bootstrap() {
    this.app.get(routes.userStates.currentUserStatePath, this.authDirector.ensureApiAuthenticated, async (req, res) => {
      try {
        const userState = await this.userStateDirector.getAsync(req.user as IUserModel);
        res.send(toUserStateDto(userState));
      } catch (err) {
        res.status(400).send(err);
      }
    });

    this.app.patch(routes.userStates.updatePath, this.authDirector.ensureApiAuthenticated, async (req, res) => {
      try {
        const insertRequest = UserStateValidator.validateAndBuildRequest(req.body);
        const userState = await this.userStateDirector.updateAsync(
          insertRequest,
          req.user
        );
        res.send(toUserStateDto(userState));
      } catch (err) {
        res.status(400).send(err);
      }
    });
  }
}
