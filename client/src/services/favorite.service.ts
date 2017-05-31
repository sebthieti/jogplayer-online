import {autoinject} from 'aurelia-framework';
import { Subject, Observable } from 'rx';
import FavoriteModel from '../models/favorite.model';
import {FavoriteRepository} from '../repositories/favorite.repository';
import {FileExplorerService} from './fileExplorer.service';
import {ChangeEvent} from '../constants';

export interface FavoriteChangeEvent {
  type: string;
  entity: FavoriteModel;
  position?: number;
}

@autoinject
export default class FavoriteService {
  private favoriteChangeSubject = new Subject<FavoriteChangeEvent>();

  constructor(
    private repository: FavoriteRepository,
    private fileExplorerService: FileExplorerService
  ) { }

  observeFavoriteChange(): Observable<FavoriteChangeEvent> {
    return this.favoriteChangeSubject.whereIsDefined();
  }

  changeSelectedFavorite(favorite: FavoriteModel) {
    return this.fileExplorerService.changeMainFolderByFavorite(favorite.folderPath);
  }

  async getFavorites(): Promise<FavoriteModel[]> {
    const favorites = await this.repository.getAsync();
    return favorites.map(fav => new FavoriteModel(fav));
  }

  async addFolderToFavoritesAsync(folderPath: string): Promise<FavoriteModel> {
    let model = new FavoriteModel().setFromFolderPath(folderPath);
    const addedFavorite = await this.repository.insertAsync(model.toInsertRequest());
    model.setFromEntity(addedFavorite);

    this.favoriteChangeSubject.onNext({
      type: ChangeEvent.Add,
      entity: model
    });

    return model;
  }

  async updateFavoriteAsync(position: number, favoriteModel: FavoriteModel): Promise<FavoriteModel> {
    const updateRequest = favoriteModel.toUpdateRequest();
    const updatedFavorite = await this.repository.updateAsync(position, updateRequest);

    favoriteModel.setFromEntity(updatedFavorite);

    this.favoriteChangeSubject.onNext({
      type: ChangeEvent.Update,
      entity: favoriteModel,
      position: position
    });

    return favoriteModel;
  }

  async removeFavorite(position: number, favoriteModel: FavoriteModel): Promise<void> {
    await this.repository.deleteAsync(position);

    this.favoriteChangeSubject.onNext({
      type: ChangeEvent.Remove,
      entity: favoriteModel,
      position: position
    });
  }
}
