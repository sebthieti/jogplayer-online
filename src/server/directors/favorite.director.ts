import {IFavoriteProxy} from '../proxies/favorite.proxy';
import {User} from '../models/user.model';
import {Favorite} from '../models/favorite.model';
import {IFavoriteDto} from '../dto/favorite.dto';

export interface IFavoriteDirector {
  addFavoriteAsync(favorite: IFavoriteDto, issuer: User): Promise<Favorite>;
  updateFromFavoriteDtoAsync(
    favoriteId: string,
    favoriteDto: IFavoriteDto,
    issuer: User
  ): Promise<Favorite>;
  removeFavoriteByIdAsync(favorite: string, issuer: User): Promise<void>;
  getUserFavoritesAsync(user: User): Promise<Favorite[]>;
}

export default class FavoriteDirector implements IFavoriteDirector {
  constructor(private favoriteProxy: IFavoriteProxy) {
  }

  getUserFavoritesAsync(user: User): Promise<Favorite[]> {
    return this.favoriteProxy.getUserFavoritesAsync(user);
  }

  addFavoriteAsync(favorite: IFavoriteDto, issuer: User): Promise<Favorite> {
    return this.favoriteProxy.addFavoriteAsync(favorite, issuer);
  }

  updateFromFavoriteDtoAsync(
    favoriteId: string,
    favoriteDto: IFavoriteDto,
    issuer: User
  ): Promise<Favorite> {
    return this.favoriteProxy.updateFromFavoriteDtoAsync(favoriteId, favoriteDto, issuer);
  }

  removeFavoriteByIdAsync(favorite: string, issuer: User): Promise<void> {
    return this.favoriteProxy.removeFavoriteByIdAsync(favorite, issuer);
  }
}
