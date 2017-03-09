import {IFavoriteRepository} from '../repositories/favorite.repository';
import {IFavoriteDto} from '../dto/favorite.dto';
import {User} from '../models/user.model';
import {Favorite} from '../models/favorite.model';

export interface IFavoriteProxy {
  addFavoriteAsync(favoriteDto: IFavoriteDto, user: User): Promise<Favorite>;
  updateFromFavoriteDtoAsync(
    favoriteId: string,
    favoriteDto: IFavoriteDto,
    user: User
  ): Promise<Favorite>;
  removeFavoriteByIdAsync(favoriteId: string, user: User): Promise<void>;
  getUserFavoritesAsync(user: User): Promise<Favorite[]>;
}

export default class FavoriteProxy implements IFavoriteProxy {
  favoriteCache = {};

  constructor(private favoriteSaveService: IFavoriteRepository) {
  }

  async addFavoriteAsync(favoriteDto: IFavoriteDto, user: User): Promise<Favorite> {
    const addedFavorite = await this.favoriteSaveService.addFavoriteAsync(favoriteDto, user);
    this.invalidateFavoritesForUser(user.username);
    return addedFavorite;
  }

  async updateFromFavoriteDtoAsync(
    favoriteId: string,
    favoriteDto: IFavoriteDto,
    user: User
  ): Promise<Favorite> {
    const favorite = await this.favoriteSaveService.updateFromFavoriteDtoAsync(
      favoriteId,
      favoriteDto,
      user
    );
    this.invalidateFavoritesForUser(user.username);
    return favorite;
  }

  async removeFavoriteByIdAsync(favoriteId: string, user: User): Promise<void> {
    await this.favoriteSaveService.removeFavoriteByIdAsync(favoriteId, user);
    this.invalidateFavoritesForUser(user.username);
  }

  async getUserFavoritesAsync(user: User): Promise<Favorite[]> {
    const userFavorites = this.favoriteCache[user.username];
    if (userFavorites != null) {
      return userFavorites;
    } else {
      const userFavorites = await this.favoriteSaveService.getSortedFavoritesAsync(user);
      this.favoriteCache[user.username] = userFavorites;
      return userFavorites;
    }
  }

  private invalidateFavoritesForUser(username: string) {
    this.favoriteCache[username] = null;
  }
}
