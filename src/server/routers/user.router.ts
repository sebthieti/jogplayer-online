import * as express from 'express';
import routes from '../routes';
import UserDto from '../dto/user.dto';
import UserPermissionsDto from '../dto/userPermissions.dto';
import {IRouter} from './router';
import {IAuthDirector} from '../directors/auth.director';
import {IUserDirector} from '../directors/user.director';

export default class UserRouter implements IRouter {
  constructor(
    private app: express.Application,
    private authDirector: IAuthDirector,
    private userDirector: IUserDirector
  ) {
  }

  bootstrap() {
    this.registerUserRoutes();
    this.registerUserPermissionsRoutes();
  }

  private registerUserRoutes() {
    this.app.get(routes.users.getPath, this.authDirector.ensureApiAuthenticated, (req, res) => {
      this.userDirector
        .getUsersAsync(req.user)
        .then(data => {
          res.send(data);
        })
        .catch(err => {
          res.status(400).send(err);
        });
    });

    this.app.post(routes.users.insertPath, this.authDirector.ensureApiAuthenticated, (req, res) => {
      Promise
        .resolve(UserDto.toDto(req.body))
        .then(dto => {
          return this.userDirector.addUserAsync(dto, req.user);
        })
        .then(data => {
          res.send(data);
        })
        .catch(err => {
          res.status(400).send(err);
        });
    });

    this.app.patch(routes.users.updatePath, this.authDirector.ensureApiAuthenticated, (req, res) => {
      Promise
        .resolve(this.assertAndGetUserId(req.params))
        .then(userId => {
          return {
            userId: userId,
            user: UserDto.toDto(req.body, userId)
          };
        })
        .then(reqSet => {
          return this.userDirector.updateFromUserDtoAsync( // TODO Maybe change method in save layer that uses dtos
            reqSet.userId,
            reqSet.user,
            req.user
          );
        })
        .then(data => {
          res.status(200).send(data);
        })
        .catch(err => {
          res.status(400).send(err);
        });
    });

    this.app.delete(routes.users.deletePath, this.authDirector.ensureApiAuthenticated, (req, res) => {
      Promise
        .resolve(this.assertAndGetUserId(req.params))
        .then(userId => {
          return this.userDirector.removeUserByIdAsync(userId, req.user);
        })
        .then(() => {
          res.sendStatus(204);
        })
        .catch(err => {
          res.status(400).send(err);
        });
    });
  }

  private registerUserPermissionsRoutes() {
    this.app.get(routes.userPermissions.getPath, this.authDirector.ensureApiAuthenticated, (req, res) => {
      Promise
        .resolve(this.assertAndGetUserId(req.params))
        .then(userId => {
          return this.userDirector.getUserPermissionsByUserId(userId, req.user);
        })
        .then(data => {
          res.send(data);
        })
        .catch(err => {
          res.status(400).send(err);
        });
    });

    this.app.patch(routes.userPermissions.updatePath, this.authDirector.ensureApiAuthenticated, (req, res) => {
      Promise
        .resolve(this.assertAndGetUserId(req.params))
        .then(userId => {
          return {
            userId: userId,
            userPermissions: UserPermissionsDto.toDto(req.body, userId)
          };
        })
        .then(reqSet => {
          return this.userDirector.updateUserPermissionsByUserIdAsync( // TODO Maybe change method in save layer that uses dtos
            reqSet.userId,
            reqSet.userPermissions,
            req.user
          );
        })
        .then(data => {
          res.status(200).send(data);
        })
        .catch(err => {
          res.status(400).send(err);
        });
    });
  }

  private assertAndGetUserId(obj) {
    if (!obj || !obj.userId) {
      throw new Error('Id must be set.');
    }
    return obj.userId;
  }
}
