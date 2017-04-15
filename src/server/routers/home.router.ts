import * as express from 'express';
import routes from '../routes';
import {IConfigDirector} from '../directors/config.director';
import {IRouter} from './router';

export default class HomeRouter implements IRouter {
  constructor(
    private app: express.Application,
    private configDirector: IConfigDirector
  ) {}

  bootstrap() {
    this.app.get('/', async (req, res) => {
      try {
        const isDbInitialized = await this.configDirector.isDbInitializedAsync();
        if (isDbInitialized) {
          // TODO Check for valid db/connection settings/ having root user account before move to setup
          res.render('index', {user: req.user});
        } else {
          res.redirect('/setup');
        }
      } catch (err) {
        res.status(400).send(err);
      }
    });

    this.app.get(routes.api, (req, res) => {
      res.send(routes.components);
    });
  }
}
