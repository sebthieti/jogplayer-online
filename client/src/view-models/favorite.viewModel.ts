import FavoriteModel from '../models/favorite.model';

export default class FavoriteViewModel extends FavoriteModel {
  isEditing: boolean;

  constructor(model: FavoriteModel) {
    super();
    Object.assign(this, model);
  }
}
