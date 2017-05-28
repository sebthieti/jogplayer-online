import {autoinject} from 'aurelia-framework';
import {IDisposable} from 'rx';
import FavoriteService from '../../../services/favorite.service';
import FavoriteViewModel from '../../../view-models/favorite.viewModel';
import {ChangeEvent} from '../../../constants';

@autoinject
export class FavoritesExplorerViewPort {
  favoritesVm: FavoriteViewModel[];

  private editingAt = -1;
  private disposable: IDisposable;

  constructor(private favoriteService: FavoriteService) {
  }

  async bind() {
    this.disposable = this.favoriteService
      .observeFavoriteChange()
      .filter(ev => ev.type === ChangeEvent.Add)
      .do(ev => this.favoritesVm.push(new FavoriteViewModel(ev.entity)))
      .subscribe();

    const favorites = await this.favoriteService.getFavorites();

    this.favoritesVm = favorites.map(fav => new FavoriteViewModel(fav));
  }

  detached() {
    this.disposable.dispose();
  }

  goToFolder(favoriteVm: FavoriteViewModel) {
    this.favoriteService.changeSelectedFavorite(favoriteVm);
  }

  editFavorite(index: number, fav: FavoriteViewModel) {
    if (this.editingAt != -1) {
      this.favoritesVm[this.editingAt].isEditing = false;
    }
    this.editingAt = index;
    fav.isEditing = true;
  }

  cancel(favorite: FavoriteViewModel) {
    this.editingAt = -1;
    favorite.isEditing = false;
  }

  async done(index: number, favorite: FavoriteViewModel) {
    await this.favoriteService.updateFavoriteAsync(index, favorite);
    favorite.isEditing = false;
    this.editingAt = -1;
  }

  async innerDeleteFavorite(index: number, favorite: FavoriteViewModel) {
    await this.favoriteService.removeFavorite(index, favorite);
    this.favoritesVm.splice(index, 1);
  }
}
