import {IFavoriteModel, Favorite} from '../models/favorite.model';
import {User} from '../models/user.model';
import {IFavoriteDto, default as FavoriteDto} from '../dto/favorite.dto';

export interface IFavoriteRepository {
  getSortedFavoritesAsync(issuer: User): Promise<Favorite[]>;
  addFavoriteAsync(favorite: FavoriteDto, issuer: User): Promise<Favorite>;
  updateFromFavoriteDtoAsync(favoriteId: string, favoriteDto: IFavoriteDto, issuer: User): Promise<Favorite>;
  removeFavoriteByIdAsync(favoriteId: string, issuer: User): Promise<void>;
}

export default class FavoriteRepository implements IFavoriteRepository {
  private Favorites: IFavoriteModel;

  constructor(favoriteModel: IFavoriteModel) {
    this.Favorites = favoriteModel;
  }

  getSortedFavoritesAsync(issuer: User): Promise<Favorite[]> {
    return this.Favorites
        .find({ ownerId: issuer.id })
        .sort('index')
        .exec();
  }

  async addFavoriteAsync(favorite: FavoriteDto, issuer: User): Promise<Favorite> {
    if (!favorite || !issuer || favorite._id) {
      if (!favorite) {
        throw new Error('FavoriteSaveService.addFavoriteAsync: favorite must be set');
      } else if (!issuer) {
        throw new Error('FavoriteSaveService.addFavoriteAsync: issuer must be set');
      } else {
        throw new Error('FavoriteSaveService.addFavoriteAsync: favorite.Id should not be set');
      }
    }

    let favFields = favorite.getDefinedFields();
    favFields.ownerId = issuer.id;

    return await this.Favorites.create(favFields);
  }

  async updateFromFavoriteDtoAsync(
    favoriteId: string,
    favoriteDto: IFavoriteDto,
    issuer: User
  ): Promise<Favorite> {
    if (!favoriteDto || !favoriteId) {
      if (!favoriteDto) {
        throw new Error('FavoriteSaveService.updateFromFavoriteDtoAsync: favorite must be set');
      } else {
        throw new Error('FavoriteSaveService.updateFromFavoriteDtoAsync: favorite.Id should be set');
      }
    }

    return await this.Favorites
      .findOneAndUpdate(
        {_id: favoriteId, ownerId: issuer.id},
        favoriteDto.getDefinedFields(),
        {'new': true} // Return modified doc.
      );
  }

  async removeFavoriteByIdAsync(favoriteId: string, issuer: User): Promise<void> {
    if (!favoriteId) {
      throw new Error('FavoriteSaveService.removeFavoriteByIdAsync: favoriteId must be set');
    }

    await this.Favorites
      .findOneAndRemove({ _id: favoriteId, ownerId: issuer.id })
      .exec();
  }
}
