import {Favorite, UpsertFavorite} from '../entities/favorite';
import {FavoriteRepository} from '../repositories/favorite.repository';

interface FavoriteModelSnapshot {
  name?: string;
  folderPath?: string;
}

export default class FavoriteModel {
  name: string;
  folderPath: string;

  private previousSnapshot: FavoriteModelSnapshot;

  constructor(
    private repository: FavoriteRepository,
    private indexFn: (favorite: FavoriteModel) => number,
    favorite?: Favorite
  ) {
    this.setFromEntity(favorite);
  }

  setFromEntity(favorite?: Favorite): FavoriteModel {
    Object.assign(this, favorite);
    this.takeSnapshot();
    return this;
  }

  async update(): Promise<FavoriteModel> {
    const index = this.indexFn(this);

    await this.repository.updateAsync(index, this.toUpsertRequest());
    return this;
  }

  private takeSnapshot(): void {
    this.previousSnapshot = {
      name: this.name,
      folderPath: this.folderPath
    };
  }

  toUpsertRequest(): UpsertFavorite {
    let upsert = {} as UpsertFavorite;

    if (this.name !== this.previousSnapshot.name) {
      upsert.name = this.name;
    } if (this.folderPath !== this.previousSnapshot.folderPath) {
      upsert.folderPath = this.folderPath;
    }

    return upsert;
  }
}
