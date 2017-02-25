import * as express from 'express';
import {IRouter} from './router';
import {IAuthDirector} from '../directors/auth.director';

export default class StateRouter implements IRouter {
  constructor(
    private app: express.Application,
    private authDirector: IAuthDirector
  ) {
  }

  bootstrap() {
    this.app.get('/api/states/:userId', this.authDirector.ensureApiAuthenticated, (req, res) => {
      res.send({
        mediaQueue: []
      });
    });
  }
}
