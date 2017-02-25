import * as express from 'express';
import routes from '../routes';
import PlaylistDto from '../dto/playlist.dto';
import {IRouter} from './router';
import {IAuthDirector} from '../directors/auth.director';
import {IPlaylistsDirector} from '../directors/playlists.director';
import {IPlaylistDirector} from '../directors/playlist.director';

export default class PlaylistRouter implements IRouter {
  constructor(
    private app: express.Application,
    private authDirector: IAuthDirector,
    private playlistDirector: IPlaylistDirector,
    private playlistsDirector: IPlaylistsDirector
  ) {
  }

  bootstrap() {
    this.registerPlaylistRoutes();
    this.registerPlaylistMediaRoutes();
  }

  private registerPlaylistRoutes() {
    this.app.get(routes.playlists.getPath, this.authDirector.ensureApiAuthenticated, (req, res) => {
      this.playlistsDirector
        .getPlaylistsAsync(req.user)
        .then(data => {
          res.send(data);
        })
        .catch(err => {
          res.status(400).send(err);
        });
    });

    this.app.patch(routes.playlists.actions.movePath, this.authDirector.ensureApiAuthenticated, (req, res) => {
      Promise
        .resolve(this.assertAndGetPlaylistIdsAndSteps(req.body))
        .then(reqSet => {
          return this.playlistsDirector.movePlaylistsAsync(reqSet.playlistIds, reqSet.steps, req.user);
        })
        .then(data => {
          res.status(200).send(data);
        })
        .catch(err => {
          res.status(400).send(err);
        });
    });

    this.app.patch(routes.playlists.updatePath, this.authDirector.ensureApiAuthenticated, (req, res) => {
      Promise
        .resolve(this.assertAndGetPlaylistId(req.params))
        .then(playlistId => {
          return {
            playlistId: playlistId,
            playlist: PlaylistDto.toDto(req.body, {overrideId: playlistId})
          };
        })
        .then(reqSet => {
          return this.playlistDirector.updatePlaylistAsync(
            reqSet.playlistId,
            reqSet.playlist,
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

    this.app.post(routes.playlists.insertPath, this.authDirector.ensureApiAuthenticated, (req, res) => {
      Promise
        .resolve(PlaylistDto.toDto(req.body, {checkAllRequiredFieldsButId: true}))
        .then(playlist => {
          return (playlist.index == null)
            ? this.playlistsDirector.addPlaylistAsync(playlist, req.user)
            : this.playlistsDirector.insertPlaylistAsync(playlist, playlist.index, req.user);
        })
        .then(newPlaylist => {
          res.send(newPlaylist);
        })
        .catch(err => {
          res.status(400).send(err);
        });
    });

    this.app.delete(routes.playlists.delete.path, this.authDirector.ensureApiAuthenticated, (req, res) => {
      Promise
        .resolve(this.assertAndGetPlaylistId(req.params))
        .then(playlistId => {
          return this.playlistsDirector.removePlaylistAsync(playlistId, req.user);
        })
        .then(() => {
          res.sendStatus(204);
        })
        .catch(err => {
          res.status(400).send(err);
        });
    });
  }

  private registerPlaylistMediaRoutes() {
    this.app.get(routes.playlists.listMedia, this.authDirector.ensureApiAuthenticated, (req, res) => {
      Promise
        .resolve(this.assertAndGetPlaylistId(req.params))
        .then(playlistId => {
          return this.playlistDirector.getMediaFromPlaylistByIdAsync(playlistId, req.user);
        })
        .then(data => {
          res.send(data);
        })
        .catch(err => {
          res.status(400).send(err);
        });
    });

    this.app.post(routes.media.insertPath, this.authDirector.ensureApiAuthenticated, (req, res) => {
      Promise
        .resolve(this.assertMediumInsertParamsFromRequest(req))
        .then(reqSet => {
          return reqSet.insertPosition !== undefined
            ? this.playlistDirector.insertMediumByFilePathAsync(
              reqSet.playlistId,
              reqSet.mediaFilePath,
              reqSet.insertPosition,
              req.user)
            : this.playlistDirector.addMediumByFilePathAsync( // TODO Like for everything i should return a Dto, not model (mediumDto)
              reqSet.playlistId,
              reqSet.mediaFilePath,
              req.user);
        })
        .then(newMedia => {
          res.send(newMedia);
        })
        .catch(err => {
          res.status(400).send(err);
        });
    });

    this.app.delete(routes.media.deletePath, this.authDirector.ensureApiAuthenticated, (req, res) => {
      Promise
        .resolve(this.assertAndGetPlaylistIdAndMediaId(req.params))
        .then(reqSet => {
          return this.playlistDirector.removeMediaAsync(reqSet.playlistId, reqSet.mediumId, req.user);
        })
        .then(() => {
          res.sendStatus(204);
        })
        .catch(err => {
          res.status(400).send(err);
        });
    });
  }

  private assertAndGetPlaylistId(obj) {
    if (!obj || !obj.playlistId) {
      throw new Error('Id must be set.');
    }
    return obj.playlistId;
  }

  private assertAndGetPlaylistIdsAndSteps(obj) {
    const playlistIds = obj.ids;
    const steps = obj.steps;

    if (!playlistIds || !steps) {
      throw new Error('ids or steps have not been providen.');
    }
    return {playlistIds: playlistIds, steps: steps};
  }

  private assertAndGetPlaylistIdAndMediaId(obj) {
    const playlistId = obj.playlistId;
    const mediumId = obj.mediumId;

    if (!playlistId || !mediumId) {
      throw new Error('playlistId or mediumId have not been providen.');
    }
    return {playlistId: playlistId, mediumId: mediumId};
  }

  private assertMediumInsertParamsFromRequest(request) {
    // TODO For all assertion enforce each type (ex mediaFilePath must be string not array of string)
    const playlistId = request.params.playlistId;
    const insertPosition = request.body.index;
    const mediaFilePath = request.body.mediaFilePath;

    if (!playlistId || !mediaFilePath) {
      throw new Error('Playlist object does not have all mandatory fields.');
    }

    const data = {
      playlistId: playlistId,
      mediaFilePath: mediaFilePath
    };

    if (insertPosition === undefined) {
      return data;
    }

    if (!isNaN(insertPosition)) {
      const index = parseInt(insertPosition);
      data.insertPosition = index;
    } else {
      throw new Error('insertPosition is not in a valid range.');
    }

    return data;
  }
}
