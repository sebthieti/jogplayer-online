import * as express from 'express';
import * as cors from 'cors';
import routes from '../routes';
import {IRouter} from './router';
import {IAuthDirector} from '../directors/auth.director';
import {IUserDirector} from '../directors/user.director';
import UserValidator from "../validators/user.validator";
import PermissionsValidator from "../validators/permissions.validator";
import {IUserPermissionsDirector} from '../directors/userPermissions.director';
import toUserPermissionDto from '../mappers/userPermissions.mapper';
import toUserDto from '../mappers/user.mapper';
import {CorsOptions} from 'cors';

export default class UserRouter implements IRouter {
  private config: CorsOptions = {
    credentials: true,
    origin: (origin: string, callback: (err: Error | null, allow?: boolean) => void) => {
      callback(null, true);
    }
  };

  constructor(
    private app: express.Application,
    private authDirector: IAuthDirector,
    private userDirector: IUserDirector,
    private permissionsDirector: IUserPermissionsDirector
  ) {}

  bootstrap() {
    this.registerUserRoutes();
    this.registerUserPermissionsRoutes();
  }

  private registerUserRoutes() {
    this.app.options(routes.users.selfPath, cors(this.config));

    this.app.get(routes.users.getPath, this.authDirector.ensureApiAuthenticated, async (req, res) => {
      try {
        const users = await this.userDirector.getUsersAsync(req.user);
        const data = users.map(user => toUserDto(user));
        res.send(data);
      } catch (err) {
        res.status(400).send(err);
      }
    });

    this.app.post(routes.users.insertPath, cors(this.config), this.authDirector.ensureApiAuthenticated, async (req, res) => {
      try {
        const insertUserRequest = UserValidator.validateAndBuildRequest(req.body);
        const insertPermissionsRequest = PermissionsValidator.validateAndBuildRequest(req.body.permissions);

        const newUser = await this.userDirector.addUserWithDefaultPermissionsAsync(
          insertUserRequest,
          insertPermissionsRequest,
          req.user);

        res.send(toUserDto(newUser));
      } catch (err) {
        res.status(400).send(err);
      }
    });

    this.app.patch(routes.users.updatePath, cors(this.config), this.authDirector.ensureApiAuthenticated, async (req, res) => {
      try {
        const userId = UserValidator.assertAndGetUserId(req.params);
        const userRequest = UserValidator.validateAndBuildRequest(req.body);

        const updatedUser = await this.userDirector.updateUserAsync(
          userId,
          userRequest,
          req.user);

        res.status(200).send(toUserDto(updatedUser));
      } catch (err) {
        res.status(400).send(err); // TODO This Maybe try a decorator approach
      }
    });

    this.app.delete(routes.users.deletePath, cors(this.config), this.authDirector.ensureApiAuthenticated, async (req, res) => {
      try {
        const userId = UserValidator.assertAndGetUserId(req.params);
        await this.userDirector.removeUserByIdAsync(userId, req.user);
        res.sendStatus(204);
      } catch (err) {
        res.status(400).send(err);
      }
    });
  }

  private registerUserPermissionsRoutes() {
    this.app.options(routes.userPermissions.selfPath, cors(this.config));

    this.app.patch(routes.userPermissions.updatePath, cors(this.config), this.authDirector.ensureApiAuthenticated, async (req, res) => {
      try {
        const userId = UserValidator.assertAndGetUserId(req.params);
        const permissions = PermissionsValidator.validateAndBuildRequest(req.body);

        const userPermissionsModel = await this.permissionsDirector.updateAsync(
          userId,
          permissions,
          req.user
        );
        res.status(200).send(toUserPermissionDto(userPermissionsModel));
      } catch (err) {
        res.status(400).send(err);
      }
    });
  }
}
