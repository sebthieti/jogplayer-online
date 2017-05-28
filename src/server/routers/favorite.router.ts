import * as express from 'express';
import routes from '../routes';
import * as cors from 'cors';
import {IAuthDirector} from '../directors/auth.director';
import {IFavoriteDirector} from '../directors/favorite.director';
import {IRouter} from './router';
import FavoriteValidator from "../validators/favorite.validator";
import toFavoriteDto from '../mappers/favorite.mapper';
import {CorsOptions} from 'cors';

export default class FavoriteRouter implements IRouter {
  private config: CorsOptions = {
    credentials: true,
    origin: (origin: string, callback: (err: Error | null, allow?: boolean) => void) => {
      callback(null, true);
    }
  };

  constructor(
    private app: express.Application,
    private authDirector: IAuthDirector,
    private favoriteDirector: IFavoriteDirector
  ) {
  }

  bootstrap() {
    this.app.options(routes.favorites.selfPath, cors(this.config));

    this.app.get(routes.favorites.getPath, this.authDirector.ensureApiAuthenticated, async (req, res) => {
      try {
        const favorites = await this.favoriteDirector.getUserFavoritesAsync(req.user);
        const data = favorites.map(fav => toFavoriteDto(fav));

        res.send(data);
      } catch (err) {
        res.status(400).send(err);
      }
    });

    this.app.post(routes.favorites.insertPath, cors(this.config), this.authDirector.ensureApiAuthenticated, async (req, res) => {
      try {
        const insertRequest = FavoriteValidator.validateAndBuildRequest(
          req.body,
          {checkAllRequiredFieldsButId: true}
        );
        const insertedFavorite = await this.favoriteDirector.addFavoriteAsync(
          insertRequest,
          req.user
        );
        res.send(toFavoriteDto(insertedFavorite));
      } catch (err) {
        res.status(400).send(err);
      }
    });

    this.app.patch(routes.favorites.updatePath, cors(this.config), this.authDirector.ensureApiAuthenticated, async (req, res) => {
      try {
        const favoriteIndex = FavoriteValidator.assertAndGetFavoriteIndex(req.params);
        const updateRequest = FavoriteValidator.validateAndBuildRequest(req.body);
        const insertedFavorite = await this.favoriteDirector.updateFavoriteAsync(
          favoriteIndex,
          updateRequest,
          req.user
        );
        res.status(200).send(toFavoriteDto(insertedFavorite));
      } catch (err) {
        res.status(400).send(err);
      }
    });

    this.app.delete(routes.favorites.deletePath, cors(this.config), this.authDirector.ensureApiAuthenticated, async (req, res) => {
      try {
        const favoriteIndex = FavoriteValidator.assertAndGetFavoriteIndex(req.params);
        await this.favoriteDirector.removeFavoriteByIdAsync(favoriteIndex, req.user);
        res.sendStatus(204);
      } catch (err) {
        res.status(400).send(err);
      }
    });
  }
}
