import {IUserModel} from '../models/user.model';
import {IFavoriteModel} from '../models/favorite.model';
import {UpsertFavoriteRequest} from '../requests/upsertFavorite.request';

export interface IFavoriteDirector {
  getUserFavoritesAsync(user: IUserModel): IFavoriteModel[];
  addFavoriteAsync(
    favoriteRequest: UpsertFavoriteRequest,
    issuer: IUserModel
  ): Promise<IFavoriteModel>;
  updateFavoriteAsync(
    favoriteIndex: number,
    favoriteRequest: UpsertFavoriteRequest,
    user: IUserModel
  ): Promise<IFavoriteModel>;
  removeFavoriteByIdAsync(favoriteIndex: number, issuer: IUserModel): Promise<void>;
}

export default class FavoriteDirector implements IFavoriteDirector {
  getUserFavoritesAsync(user: IUserModel): IFavoriteModel[] {
    return user.favorites.getFavorites();
  }

  async addFavoriteAsync(
    favoriteRequest: UpsertFavoriteRequest,
    issuer: IUserModel
  ): Promise<IFavoriteModel> {
    return issuer.favorites.addFavoriteAsync(
      issuer.favorites
        .buildNew()
        .setFromRequest(favoriteRequest)
    );
  }

  updateFavoriteAsync(
    favoriteIndex: number,
    favoriteRequest: UpsertFavoriteRequest,
    issuer: IUserModel
  ): Promise<IFavoriteModel> {
    return issuer.favorites
      .getFavorite(favoriteIndex)
      .setFromRequest(favoriteRequest)
      .updateFavoriteAsync();
  }

  async removeFavoriteByIdAsync(favoriteIndex: number, issuer: IUserModel): Promise<void> {
    await issuer.favorites.removeFavorite(favoriteIndex);
  }
}
