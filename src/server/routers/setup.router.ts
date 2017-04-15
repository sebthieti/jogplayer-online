import * as express from 'express';
import {IRouter} from './router';
import {IUserDirector} from '../directors/user.director';

export default class SetupRouter implements IRouter {
  constructor(
    private app: express.Application,
    private userDirector: IUserDirector
  ) {}

  bootstrap() {
    this.app.get('/setup', (req, res) => {
      res.render('setup');
    });

    this.app.post('/setup', async (req, res) => {
      await this.userDirector.addRootUserAsync(req.body);
      res.redirect('/');
    });
  }
}
