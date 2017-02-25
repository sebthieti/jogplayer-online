import * as express from 'express';
import routes from '../routes';
import FavoriteDto from '../dto/favorite.dto';
import {IAuthDirector} from '../directors/auth.director';
import {IFavoriteDirector} from '../directors/favorite.director';
import {IRouter} from './router';

export default class FavoriteRouter implements IRouter {
  constructor(
    private app: express.Application,
    private authDirector: IAuthDirector,
    private favoriteDirector: IFavoriteDirector
  ) {
  }

  bootstrap() {
    this.app.get(routes.favorites.getPath, this.authDirector.ensureApiAuthenticated, (req, res) => {
      this.favoriteDirector
        .getUserFavoritesAsync(req.user)
        .then(data => {
          res.send(data);
        })
        .catch(err => {
          res.status(400).send(err);
        });
    });

    this.app.post(routes.favorites.insertPath, this.authDirector.ensureApiAuthenticated, (req, res) => {
      Promise
        .resolve(FavoriteDto.toDto(req.body, {checkAllRequiredFieldsButId: true}))
        .then(dto => {
          return this.favoriteDirector.addFavoriteAsync(dto, req.user);
        })
        .then(data => {
          res.send(data);
        })
        .catch(err => {
          res.status(400).send(err);
        });
    });

    this.app.patch(routes.favorites.updatePath, this.authDirector.ensureApiAuthenticated, (req, res) => {
      Promise
        .resolve(this.assertAndGetFavoriteId(req.params))
        .then(favId => {
          return {
            favId: favId,
            favorite: FavoriteDto.toDto(req.body, {overrideId: favId})
          };
        })
        .then(reqSet => {
          return this.favoriteDirector.updateFromFavoriteDtoAsync( // TODO Maybe change method in save layer that uses dtos
            reqSet.favId,
            reqSet.favorite,
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

    this.app.delete(routes.favorites.deletePath, this.authDirector.ensureApiAuthenticated, (req, res) => {
      Promise
        .resolve(this.assertAndGetFavoriteId(req.params))
        .then(dto => {
          return this.favoriteDirector.removeFavoriteByIdAsync(dto, req.user);
        })
        .then(() => {
          res.sendStatus(204);
        })
        .catch(err => {
          res.status(400).send(err);
        });
    });
  }

  private assertAndGetFavoriteId(obj) {
    if (!obj || !obj.favId) {
      throw new Error('Id must be set.');
    }
    return obj.favId;
  }
}
