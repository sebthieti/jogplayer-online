import {Favorite, InsertFavorite, UpdateFavorite} from '../entities/favorite';
import {extractFolderNameFromPath} from '../helpers/folder.helper';

interface FavoriteModelSnapshot {
  name?: string;
  folderPath?: string;
}

export default class FavoriteModel {
  name: string;
  folderPath: string;

  private previousSnapshot: FavoriteModelSnapshot;

  constructor(favorite?: Favorite) {
    this.setFromEntity(favorite);
  }

  setFromFolderPath(folderPath: string): FavoriteModel {
    this.folderPath = folderPath;
    this.name = extractFolderNameFromPath(folderPath);

    return this;
  }

  setFromEntity(favorite?: Favorite): FavoriteModel {
    Object.assign(this, favorite);
    this.takeSnapshot();
    return this;
  }

  private takeSnapshot(): void {
    this.previousSnapshot = {
      name: this.name,
      folderPath: this.folderPath
    };
  }

  toUpdateRequest(): UpdateFavorite {
    let upsert = {} as UpdateFavorite;

    if (this.name !== this.previousSnapshot.name) {
      upsert.name = this.name;
    } if (this.folderPath !== this.previousSnapshot.folderPath) {
      upsert.folderPath = this.folderPath;
    }

    return upsert;
  }

  toEntity(): Favorite {
    return {
      name: this.name,
      folderPath: this.folderPath
    }
  }
}
