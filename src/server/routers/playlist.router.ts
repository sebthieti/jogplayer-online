import * as express from 'express';
import routes from '../routes';
import * as cors from 'cors';
import {IRouter} from './router';
import {IAuthDirector} from '../directors/auth.director';
import {IPlaylistsDirector} from '../directors/playlists.director';
import {IPlaylistDirector} from '../directors/playlist.director';
import PlaylistValidator from '../validators/playlist.validator';
import toPlaylistDto from '../mappers/playlist.mapper';
import {isNullOrUndefined} from 'util';
import toMediumDto from '../mappers/medium.mapper';
import {CorsOptions} from 'cors';

export default class PlaylistRouter implements IRouter {
  private config: CorsOptions = {
    credentials: true,
    origin: (origin: string, callback: (err: Error | null, allow?: boolean) => void) => {
      callback(null, true);
    }
  };

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
    this.app.options(routes.playlists.getPath, cors(this.config));
    this.app.options(routes.playlists.actions.movePath, cors(this.config));

    this.app.get(routes.playlists.getPath, cors(this.config), this.authDirector.ensureApiAuthenticated, async (req, res) => {
      try {
        const playlists = await this.playlistsDirector.getPlaylistsAsync(req.user);
        const data = playlists.map(pl => toPlaylistDto(pl));

        res.send(data);
      } catch (err) {
        res.status(400).send(err);
      }
    });

    this.app.patch(routes.playlists.actions.movePath, cors(this.config), this.authDirector.ensureApiAuthenticated, async (req, res) => {
      try {
        const reqSet = PlaylistValidator.assertAndGetPlaylistIdsAndSteps(req.body);
        const playlists = await this.playlistsDirector.movePlaylistsAsync(
          reqSet.playlistIds,
          reqSet.steps,
          req.user);
        const data = playlists.map(pl => toPlaylistDto(pl));
        res.send(data);
      } catch (err) {
        res.status(400).send(err);
      }
    });

    this.app.patch(routes.playlists.updatePath, cors(this.config), this.authDirector.ensureApiAuthenticated, async (req, res) => {
      try {
        const playlistIndex = PlaylistValidator.getIndex(req.params);
        const updateRequest = PlaylistValidator.validateAndBuildRequest(req.body);
        const playlist = await this.playlistDirector.updatePlaylistAsync(
          playlistIndex,
          updateRequest,
          req.user);
        res.send(toPlaylistDto(playlist));
      } catch (err) {
        res.status(400).send(err);
      }
    });

    this.app.post(routes.playlists.insertPath, cors(this.config), this.authDirector.ensureApiAuthenticated, async (req, res) => {
      try {
        const playlistIndex = PlaylistValidator.getIndex(req.params);
        const insertRequest = PlaylistValidator.validateAndBuildRequest(
          req.body,
          {checkAllRequiredFieldsButId: true});

        const playlist = isNullOrUndefined(playlistIndex)
          ? await this.playlistsDirector.addPlaylistAsync(insertRequest, req.user)
          : await this.playlistsDirector.insertPlaylistAsync(insertRequest, playlistIndex, req.user);
        res.send(toPlaylistDto(playlist));
      } catch (err) {
        res.status(400).send(err);
      }
    });

    this.app.delete(routes.playlists.delete.path, cors(this.config), this.authDirector.ensureApiAuthenticated, async (req, res) => {
      try {
        const playlistIndex = PlaylistValidator.getIndex(req.params);
        await this.playlistsDirector.removePlaylistAsync(playlistIndex, req.user);
        res.sendStatus(204);
      } catch (err) {
        res.status(400).send(err);
      }
    });
  }

  private registerPlaylistMediaRoutes() {
    this.app.options(routes.playlists.listMedia, cors(this.config));

    this.app.get(routes.playlists.listMedia, cors(this.config), this.authDirector.ensureApiAuthenticated, async (req, res) => {
      try {
        const playlistIndex = PlaylistValidator.getIndex(req.params);
        const media = await this.playlistDirector.getMediaFromPlaylistByIndexAsync(
          playlistIndex,
          req.user);
        const data = media.map(m => toMediumDto(m));
        res.send(data);
      } catch (err) {
        res.status(400).send(err);
      }
    });

    this.app.post(routes.media.insertPath, cors(this.config), this.authDirector.ensureApiAuthenticated, async (req, res) => {
      try {
        const reqSet = PlaylistValidator.assertMediumInsertParamsFromRequest(req);
        const newMedia = isNullOrUndefined(reqSet.insertPosition)
          ? await this.playlistDirector.addMediumByFilePathAsync(
            reqSet.playlistIndex,
            reqSet.mediaFilePath,
            req.user)
          : await this.playlistDirector.insertMediumByFilePathAsync(
            reqSet.playlistIndex,
            reqSet.mediaFilePath,
            reqSet.insertPosition,
            req.user);

        res.send(toMediumDto(newMedia));
      } catch (err) {
        res.status(400).send(err);
      }
    });

    this.app.delete(routes.media.deletePath, cors(this.config), this.authDirector.ensureApiAuthenticated, async (req, res) => {
      try {
        const reqSet = PlaylistValidator.assertAndGetPlaylistIdAndMediaId(req.params);
        await this.playlistDirector.removeMediaAsync(reqSet.playlistIndex, reqSet.mediumId, req.user);
        res.sendStatus(204);
      } catch (err) {
        res.status(400).send(err);
      }
    });
  }
}
