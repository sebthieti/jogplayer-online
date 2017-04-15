import * as express from 'express';
import {IAuthDirector} from '../directors/auth.director';
import {IFileExplorerDirector} from '../directors/fileExplorer.director';
import {IRouter} from './router';

export default class FileExplorerRouter implements IRouter {
  constructor(
    private app: express.Application,
    private authDirector: IAuthDirector,
    private fileExplorerDirector: IFileExplorerDirector
  ) {
  }

  bootstrap() {
    this.app.get('/', this.authDirector.ensureApiAuthenticated, (req, res) => {
      res.render('index');
    });

    // Explore directory path TODO Use constants for url instead
    this.app.get(/^\/api\/explore\/(.*[\/])*$/, this.authDirector.ensureApiAuthenticated, async (req, res) => {
      try {
        const fileDetails = await this.fileExplorerDirector.getFolderContentAsync(
          this.extractUrlFromParams(req.params),
          req.user
        );
        res.send(fileDetails);
      } catch (err) {
        res.status(400).send(err);
      }
    });

    // Get file info by path
    this.app.get(/^\/api\/explore\/(.*[\/].*)*$/, this.authDirector.ensureApiAuthenticated, async (req, res) => {
      try {
        const fileDetails = await this.fileExplorerDirector.getFileInfoAsync(
          this.extractUrlFromParams(req.params),
          req.user
        );
        res.send(fileDetails);
      } catch (err) {
        res.status(400).send(err);
      }
    });
  }

  private extractUrlFromParams(params) {
    return ('/' + (params[0] || '')) || '';
  }
}
