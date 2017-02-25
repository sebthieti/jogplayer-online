import {IFavoriteRepository} from '../repositories/favorite.repository';

export interface IFavoriteProxy {
  addFavoriteAsync(favorite, user);
  updateFromFavoriteDtoAsync(favoriteId, favoriteDto, user);
  removeFavoriteByIdAsync(favoriteId, user);
  getUserFavoritesAsync(user);
  invalidateFavoritesForUser(username);
}

export default class FavoriteProxy implements IFavoriteProxy {
  favoriteCache = {};

  constructor(private favoriteSaveService: IFavoriteRepository) {
  }

  addFavoriteAsync(favorite, user) {
    return this.favoriteSaveService
      .addFavoriteAsync(favorite, user)
      .then(addedFavorite => {
        this.invalidateFavoritesForUser(user.username);
        return addedFavorite;
      });
  }

  updateFromFavoriteDtoAsync(favoriteId, favoriteDto, user) {
    return this.favoriteSaveService
      .updateFromFavoriteDtoAsync(favoriteId, favoriteDto, user)
      .then(favorite => {
        this.invalidateFavoritesForUser(user.username);
        return favorite;
      });
  }

  removeFavoriteByIdAsync(favoriteId, user) {
    return this.favoriteSaveService
      .removeFavoriteByIdAsync(favoriteId, user)
      .then(() =>
        this.invalidateFavoritesForUser(user.username)
      );
  }

  getUserFavoritesAsync(user) {
    const userFavorites = this.favoriteCache[user.username];
    if (userFavorites != null) {
      return Promise.resolve(userFavorites);
    } else {
      return this.favoriteSaveService
        .getSortedFavoritesAsync(user)
        .then(userFavorites => {
          this.favoriteCache[user.username] = userFavorites;
          return userFavorites;
        });
    }
  }

  invalidateFavoritesForUser(username) {
    this.favoriteCache[username] = null;
  }
}
