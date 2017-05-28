import {autoinject} from 'aurelia-framework';
import FavoriteService from '../../../services/favorite.service';
import FavoriteViewModel from '../../../view-models/favorite.viewModel';

@autoinject
export class FavoritesExplorerViewPort {
  favoritesVm: FavoriteViewModel[];

  private editingAt = -1;

  constructor(private favoriteService: FavoriteService) {
  }

  async bind() {
    const favorites = await this.favoriteService.getFavorites();
    this.favoritesVm = favorites.map(fav => new FavoriteViewModel(fav));

    this.favoriteService
      .observeFavorites()
      .do(favs => this.favoritesVm = favs.map(fav => new FavoriteViewModel(fav)))
      .subscribe();
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

  async innerDeleteFavorite(index: number) {
    await this.favoriteService.removeFavorite(index);
    this.favoritesVm.splice(index, 1);
  }
}
