import * as express from 'express';
import routes from '../routes';
import * as cors from 'cors';
import {IRouter} from './router';
import {IAuthDirector} from '../directors/auth.director';
import {IUserStateDirector} from '../directors/userState.director';
import UserStateValidator from '../validators/userState.validator';
import {IUserModel} from '../models/user.model';
import toUserStateDto from '../mappers/userState.mapper';
import {CorsOptions} from 'cors';

export default class UserStateRouter implements IRouter {
  private config: CorsOptions = {
    credentials: true,
    origin: (origin: string, callback: (err: Error | null, allow?: boolean) => void) => {
      callback(null, true);
    }
  };

  constructor(
    private app: express.Application,
    private authDirector: IAuthDirector,
    private userStateDirector: IUserStateDirector
  ) {}

  bootstrap() {
    this.app.options(routes.userStates.selfPath, cors(this.config));

    this.app.get(routes.userStates.selfPath, this.authDirector.ensureApiAuthenticated, async (req, res) => {
      try {
        const userState = await this.userStateDirector.getAsync(req.user as IUserModel);
        res.send(toUserStateDto(userState));
      } catch (err) {
        res.status(400).send(err);
      }
    });

    this.app.patch(routes.userStates.updatePath, cors(this.config), this.authDirector.ensureApiAuthenticated, async (req, res) => {
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
