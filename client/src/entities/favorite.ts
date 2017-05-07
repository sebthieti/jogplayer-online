export interface Favorite {
  name: string;
  folderPath: string;
}

export interface UpsertFavorite {
  name?: string;
  folderPath?: string;
}
