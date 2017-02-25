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
    this.app.get('/', (req, res) => {
      this.configDirector
        .isDbInitializedAsync()
        //.checkFileConfigExistsAsync()
        .then(exists => {
          if (exists) {
            // TODO Check for valid db/connection settings/ having root user account before move to setup
            res.render('index', {user: req.user});
          } else {
            res.redirect('/setup');
          }
        });
    });

    this.app.get(routes.api, (req, res) => {
      res.send(routes.components);
    });
  }
}
