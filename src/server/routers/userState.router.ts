import * as express from 'express';
import routes from '../routes';
import UserStateDto from '../dto/userState.dto';
import {IRouter} from './router';
import {IAuthDirector} from '../directors/auth.director';
import {IUserStateDirector} from '../directors/userState.director';

export default class UserStateRouter implements IRouter {
  constructor(
    private app: express.Application,
    private authDirector: IAuthDirector,
    private userStateDirector: IUserStateDirector
  ) {
  }

  bootstrap() {
    this.app.get(routes.userStates.currentUserStatePath, this.authDirector.ensureApiAuthenticated, (req, res) => {
      return this.userStateDirector
        .getUserStateAsync(req.user)
        .then(data => {
          res.send(data);
        })
        .catch(err => {
          res.status(400).send(err);
        });
    });

    this.app.post(routes.userStates.insertPath, this.authDirector.ensureApiAuthenticated, (req, res) => {
      Promise
        .resolve(UserStateDto.toDto(req.body))
        .then(dto => {
          return this.userStateDirector.addUserStateAsync(dto, req.user);
        })
        .then(data => {
          res.send(data);
        })
        .catch(err => {
          res.status(400).send(err);
        });
    });

    this.app.patch(routes.userStates.updatePath, this.authDirector.ensureApiAuthenticated, (req, res) => {
      Promise
        .resolve(this.assertAndGetUserStateId(req.params))
        .then(userStateId => {
          return {
            userStateId: userStateId,
            userStateDto: UserStateDto.toDto(req.body)
          };
        })
        .then(reqSet => {
          return this.userStateDirector.updateFromUserStateDtoAsync( // TODO Maybe change method in save layer that uses dtos
            reqSet.userStateId,
            reqSet.userStateDto,
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

    //this.app.delete(routes.users.deletePath, this.authDirector.ensureApiAuthenticated, function(req, res) {
    //	Q.fcall(assertAndGetUserStateId, req.params)
    //	.then(function(userId) {
    //		return userStateDirector.removeUserByIdAsync(userId, req.user);
    //	})
    //	.then(function() { res.send(204) })
    //	.catch(function(err) { res.send(400, err) })
    //	.done();
    //});
  }

  private assertAndGetUserStateId(obj) {
    if (!obj || !obj.userStateId) {
      throw new Error('Id must be set.');
    }
    return obj.userStateId;
  }
}
