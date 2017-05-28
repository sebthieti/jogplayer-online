import {autoinject} from 'aurelia-framework';
import { Subject, Observable } from 'rx';
import FavoriteModel from '../models/favorite.model';
import {FavoriteRepository} from '../repositories/favorite.repository';
import PlaylistExplorerService from './playlistExplorer.service';
import FileExplorerService from './fileExplorer.service';

@autoinject
export default class FavoriteService {
  private favorites: FavoriteModel[] = [];
  private favoritesSubject = new Subject<FavoriteModel[]>();

  constructor(
    private repository: FavoriteRepository,
    private playlistExplorerService: PlaylistExplorerService,
    private fileExplorerService: FileExplorerService
  ) { }

  observeFavorites(): Observable<FavoriteModel[]> {
    return this.favoritesSubject.whereIsDefined();
  }

  changeSelectedFavorite(favorite: FavoriteModel) {
    //noinspection JSIgnoredPromiseFromCall
    this.playlistExplorerService.changeFolderByApiUrlAndResetSelection(favorite.folderPath);
    //noinspection JSIgnoredPromiseFromCall
    this.fileExplorerService.changeFolderByApiUrlAndResetSelection(favorite.folderPath);
  }

  async getFavorites(): Promise<FavoriteModel[]> {
    const favorites = await this.repository.getAsync();

    this.favorites = favorites.map(fav => new FavoriteModel(fav));
    return this.favorites;
  }

  async addFolderToFavoritesAsync(folderPath: string): Promise<FavoriteModel> {
    let model = new FavoriteModel().setFromFolderPath(folderPath);
    const addedFavorite = await this.repository.insertAsync(model.toInsertRequest());
    model.setFromEntity(addedFavorite);

    this.favorites.push(model);
    this.favoritesSubject.onNext(this.favorites);

    return model;
  }

  async updateFavoriteAsync(position: number, favoriteModel: FavoriteModel): Promise<FavoriteModel> {
    const updateRequest = favoriteModel.toUpdateRequest();
    const updatedFavorite = await this.repository.updateAsync(position, updateRequest);
    this.favorites[position] = favoriteModel.setFromEntity(updatedFavorite);

    return favoriteModel;
  }

  async removeFavorite(position: number): Promise<void> {
    await this.repository.deleteAsync(position);
    this.favorites.splice(position, 1);
  }
}
