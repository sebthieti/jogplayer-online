import * as express from 'express';
import routes from '../routes';
import {IRouter} from './router';
import {IAuthDirector} from '../directors/auth.director';
import {IPlaylistsDirector} from '../directors/playlists.director';
import {IPlaylistDirector} from '../directors/playlist.director';
import PlaylistValidator from '../validators/playlist.validator';
import toPlaylistDtoAsync from '../mappers/playlist.mapper';
import {isNullOrUndefined} from 'util';
import toMediumDto from '../mappers/medium.mapper';

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
    this.app.get(routes.playlists.getPath, this.authDirector.ensureApiAuthenticated, async (req, res) => {
      try {
        const playlists = await this.playlistsDirector.getPlaylistsAsync(req.user);
        const data = await Promise.all(playlists.map(pl => toPlaylistDtoAsync(pl)));

        res.send(data);
      } catch (err) {
        res.status(400).send(err);
      }
    });

    this.app.patch(routes.playlists.actions.movePath, this.authDirector.ensureApiAuthenticated, async (req, res) => {
      try {
        const reqSet = PlaylistValidator.assertAndGetPlaylistIdsAndSteps(req.body);
        const playlists = await this.playlistsDirector.movePlaylistsAsync(
          reqSet.playlistIds,
          reqSet.steps,
          req.user);
        const data = await Promise.all(playlists.map(pl => toPlaylistDtoAsync(pl)));
        res.status(200).send(data);
      } catch (err) {
        res.status(400).send(err);
      }
    });

    this.app.patch(routes.playlists.updatePath, this.authDirector.ensureApiAuthenticated, async (req, res) => {
      try {
        const playlistIndex = PlaylistValidator.getIndex(req.params);
        const updateRequest = PlaylistValidator.validateAndBuildRequest(req.body);
        const playlist = await this.playlistDirector.updatePlaylistAsync(
          playlistIndex,
          updateRequest,
          req.user);
        const data = await toPlaylistDtoAsync(playlist);
        res.status(200).send(data);
      } catch (err) {
        res.status(400).send(err);
      }
    });

    this.app.post(routes.playlists.insertPath, this.authDirector.ensureApiAuthenticated, async (req, res) => {
      try {
        const playlistIndex = PlaylistValidator.getIndex(req.params);
        const insertRequest = PlaylistValidator.validateAndBuildRequest(
          req.body,
          {checkAllRequiredFieldsButId: true});

        const playlist = (playlistIndex == null)
          ? await this.playlistsDirector.addPlaylistAsync(insertRequest, req.user)
          : await this.playlistsDirector.insertPlaylistAsync(insertRequest, playlistIndex, req.user);

        res.status(200).send(toPlaylistDtoAsync(playlist));
      } catch (err) {
        res.status(400).send(err);
      }
    });

    this.app.delete(routes.playlists.delete.path, this.authDirector.ensureApiAuthenticated, async (req, res) => {
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
    this.app.get(routes.playlists.listMedia, this.authDirector.ensureApiAuthenticated, async (req, res) => {
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

    this.app.post(routes.media.insertPath, this.authDirector.ensureApiAuthenticated, async (req, res) => {
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

    this.app.delete(routes.media.deletePath, this.authDirector.ensureApiAuthenticated, async (req, res) => {
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
