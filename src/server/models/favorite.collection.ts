import {Favorite} from '../entities/favorite';
import {IFavoriteRepository} from '../repositories/favorite.repository';
import {IUserModel} from './user.model';
import FavoriteModel, {IFavoriteModel} from './favorite.model';

export interface IFavoriteCollection {
  getFavorites(): IFavoriteModel[];
  getFavorite(favoriteIndex: number): IFavoriteModel;
  addFavoriteAsync(favorite: IFavoriteModel): Promise<IFavoriteModel>;
  removeFavorite(favoriteIndex: number): Promise<void>;
  buildNew(): IFavoriteModel;
  toEntity(): Favorite[];
}

export default class FavoriteCollection implements IFavoriteCollection {
  private favorites: IFavoriteModel[];

  constructor(
    private favoriteRepository: IFavoriteRepository,
    private user: IUserModel,
    favorites: Favorite[]
  ) {
    this.favorites = favorites && favorites.map((fav, index) => new FavoriteModel(
      this.favoriteRepository,
      user,
      this.getFavoriteIndex.bind(this),
      fav
    )) || [];
  }

  buildNew(): IFavoriteModel {
    return new FavoriteModel(this.favoriteRepository, this.user, _ => this.favorites.length);
  }

  getFavorites(): IFavoriteModel[] {
    return this.favorites;
  }

  getFavorite(favoriteIndex: number): IFavoriteModel {
    return this.favorites[favoriteIndex];
  }

  async addFavoriteAsync(favorite: IFavoriteModel): Promise<IFavoriteModel> {
    await this.favoriteRepository.addAsync(favorite.toEntity(), this.user._id);
    const size = this.favorites.push(favorite);
    return this.favorites[size - 1];
  }

  async removeFavorite(favoriteIndex: number): Promise<void> {
    await this.favoriteRepository.removeByIdAsync(
      favoriteIndex,
      this.user._id);
    this.favorites.splice(favoriteIndex, 1);
  }

  private getFavoriteIndex(model: IFavoriteModel): number {
    return this.favorites.indexOf(model);
  }

  toEntity(): Favorite[] {
    return this.favorites.map(p => p.toEntity());
  }
}
