import * as express from 'express';
import routes from '../routes';
import {IRouter} from './router';
import {IAuthDirector} from '../directors/auth.director';
import {IMediaDirector} from '../directors/media.director';
import {IMediaStreamer} from '../stream/mediaStreamer';

export default class PlayMediaRouter implements IRouter {
  constructor(
    private app: express.Application,
    private authDirector: IAuthDirector,
    private mediaDirector: IMediaDirector,
    private mediaStreamer: IMediaStreamer
  ) {
  }

  bootstrap() {
    this.app.get(routes.media.selfPath, this.authDirector.ensureApiAuthenticated, (req, res) => {
      Promise
        .resolve(this.assertAndGetPlaylistIdsAndMediumId(req.params))
        .then(reqSet => {
          return this.mediaDirector.getMediumByIdAndPlaylistIdAsync(reqSet.playlistId, reqSet.mediumId, req.user);
        })
        .then(data => {
          res.status(200).send(data);
        })
        .catch(err => {
          res.status(400).send(err);
        });
    });

    this.app.get(routes.media.selfPlay, this.authDirector.ensureApiAuthenticated, (req, res) => {
      const mediumIdWithExt = req.params.mediumIdWithExt;
      this.mediaStreamer.streamByMediaIdAndExt(mediumIdWithExt, req, res);
    });

    // Read media with given file path.
    this.app.get(routes.file.selfPlayPattern, this.authDirector.ensureApiAuthenticated, (req, res) => {
      const mediaPath = req.params[0];
      this.mediaStreamer.streamByMediaPath(mediaPath, req, res);
    });
  }

  private assertAndGetPlaylistIdsAndMediumId(params) {
    const playlistId = params.playlistId;
    const mediumId = params.mediumId;

    if (!playlistId || !mediumId) {
      throw new Error('playlistId or mediumId have not been provided.');
    }
    return {playlistId: playlistId, mediumId: mediumId};
  }
}
