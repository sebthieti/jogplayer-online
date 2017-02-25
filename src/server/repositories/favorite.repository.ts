import * as mongoose from 'mongoose';
import {IFavoriteModel} from '../models/favorite.model';

export interface IFavoriteRepository {
  getSortedFavoritesAsync(issuer);
  addFavoriteAsync(favorite, issuer): Promise<mongoose.Schema>;
  updateFromFavoriteDtoAsync(favoriteId, favoriteDto, issuer): Promise<mongoose.Schema>;
  removeFavoriteByIdAsync(favoriteId, issuer): Promise<mongoose.Schema>;
}

export default class FavoriteRepository implements IFavoriteRepository {
  private Favorites: IFavoriteModel;

  constructor(favoriteModel: IFavoriteModel) {
    this.Favorites = favoriteModel;
  }

  getSortedFavoritesAsync(issuer) {
    return this.Favorites
        .find({ ownerId: issuer.id })
        .sort('index')
        .exec();
  }

  addFavoriteAsync(favorite, issuer): Promise<mongoose.Schema> {
    return new Promise((resolve, reject) => {
      if (!favorite || !issuer || favorite._id) {
        if (!favorite) {
          reject(new Error('FavoriteSaveService.addFavoriteAsync: favorite must be set'));
        } else if (!issuer) {
          reject(new Error('FavoriteSaveService.addFavoriteAsync: issuer must be set'));
        } else if (favorite._id) {
          reject(new Error('FavoriteSaveService.addFavoriteAsync: favorite.Id should not be set'));
        }
        return;
      }

      let favFields = favorite.getDefinedFields();
      favFields.ownerId = issuer.id;

      this.Favorites.create(
        favFields,
        (err, favorite) => {
          if (err) {
            reject(err);
          } else {
            resolve(favorite);
          }
        });
    });
  }

  updateFromFavoriteDtoAsync(favoriteId, favoriteDto, issuer): Promise<mongoose.Schema> {
    return new Promise((resolve, reject) => {
      if (!favoriteDto || !favoriteId) {
        if (!favoriteDto) {
          reject(new Error('FavoriteSaveService.updateFromFavoriteDtoAsync: favorite must be set'));
        } else if (!favoriteId) {
          reject(new Error('FavoriteSaveService.updateFromFavoriteDtoAsync: favorite.Id should be set'));
        }
        return;
      }

      this.Favorites.findOneAndUpdate(
        {_id: favoriteId, ownerId: issuer.id},
        favoriteDto.getDefinedFields(),
        {'new': true}, // Return modified doc.
        (err, favorite) => {
          if (err) {
            reject(err);
          } else {
            resolve(favorite);
          }
        }
      );
    });
  }

  removeFavoriteByIdAsync(favoriteId, issuer): Promise<mongoose.Schema> {
    return new Promise((resolve, reject) => {
      if (!favoriteId) {
        reject(new Error('FavoriteSaveService.removeFavoriteByIdAsync: favoriteId must be set'));
        return;
      }

      this.Favorites.findOneAndRemove(
        { _id: favoriteId, ownerId: issuer.id },
        err => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        }
      );
    });
  }
}
