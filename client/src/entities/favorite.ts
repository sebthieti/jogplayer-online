export interface Favorite {
  name: string;
  folderPath: string;
}

export interface InsertFavorite {
  name: string;
  folderPath: string;
}

export interface UpdateFavorite {
  name?: string;
  folderPath?: string;
}
