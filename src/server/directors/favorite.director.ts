import {IFavoriteProxy} from '../proxies/favorite.proxy';

export interface IFavoriteDirector {
  addFavoriteAsync(favorite, user);
  updateFromFavoriteDtoAsync(favoriteId, favoriteDto, user);
  removeFavoriteByIdAsync(favoriteId, user);
  getUserFavoritesAsync(user);
}

export default class FavoriteDirector implements IFavoriteDirector {
  constructor(private favoriteProxy: IFavoriteProxy) {
  }

  getUserFavoritesAsync(user) {
    return this.favoriteProxy.getUserFavoritesAsync(user);
  }

  addFavoriteAsync(favorite, issuer) {
    return this.favoriteProxy.addFavoriteAsync(favorite, issuer);
  }

  updateFromFavoriteDtoAsync(favoriteId, favoriteDto, issuer) {
    return this.favoriteProxy.updateFromFavoriteDtoAsync(favoriteId, favoriteDto, issuer);
  }

  removeFavoriteByIdAsync(favorite, issuer) {
    return this.favoriteProxy.removeFavoriteByIdAsync(favorite, issuer);
  }
}
