import * as express from 'express';
import {IRouter} from './router';
import {IConfigDirector} from '../directors/config.director';

export default class SetupRouter implements IRouter {
  constructor(
    private app: express.Application,
    private configDirector: IConfigDirector
  ) {
  }

  bootstrap() {
    this.app.get('/setup', (req, res) => {
      res.render('setup');
    });

    this.app.post('/setup', (req, res) => {
      this.configDirector
        .setRootUserAsync(req.body)
        .then(() => {
          res.redirect('/');
        });
    });
  }
}
