import * as express from 'express';
import * as cors from 'cors';
import routes from '../routes';
import {IRouter} from './router';
import {IAuthDirector} from '../directors/auth.director';
import {IMediaDirector} from '../directors/media.director';
import {IMediaStreamer} from '../stream/mediaStreamer';
import MediumValidator from '../validators/medium.validator';
import {CorsOptions} from 'cors';

export default class MediaRouter implements IRouter {
  private config: CorsOptions = {
    credentials: true,
    origin: (origin: string, callback: (err: Error | null, allow?: boolean) => void) => {
      callback(null, true);
    }
  };

  constructor(
    private app: express.Application,
    private authDirector: IAuthDirector,
    private mediaDirector: IMediaDirector,
    private mediaStreamer: IMediaStreamer
  ) {}

  bootstrap() {
    this.app.options(routes.media.selfPath, cors(this.config));
    this.app.options(routes.file.selfPlayPattern, cors(this.config));

    this.app.get(routes.media.selfPath, cors(this.config), this.authDirector.ensureApiAuthenticated, async (req, res) => {
      try {
        const reqSet = MediumValidator.assertAndGetPlaylistIndexAndMediumId(req.params);
        const data = await this.mediaDirector.getMediumByIdAndPlaylistIdAsync(
          reqSet.playlistIndex,
          reqSet.mediumId,
          req.user);

        res.status(200).send(data);
      } catch (err) {
        res.status(400).send(err);
      }
    });

    this.app.get(routes.media.selfPlay, cors(this.config), this.authDirector.ensureApiAuthenticated, (req, res) => {
      const mediumIdWithExt = req.params.mediumIdWithExt;
      this.mediaStreamer.streamByMediaIdAndExt(mediumIdWithExt, req, res);
    });

    // Read media with given file path.
    this.app.get(routes.file.selfPlayPattern, cors(this.config), this.authDirector.ensureApiAuthenticated, (req, res) => {
      const mediaPath = req.params[0];
      this.mediaStreamer.streamByMediaPath(mediaPath, req, res);
    });
  }
}
