import {IUserModel} from '../models/user.model';
import {IPlaylistModel} from '../models/playlist.model';
import {UpsertPlaylistRequest} from '../requests/updatePlaylist.request';

export interface IPlaylistsDirector {
  getPlaylistsAsync(issuer: IUserModel): IPlaylistModel[];
  addPlaylistAsync(request: UpsertPlaylistRequest, issuer: IUserModel): Promise<IPlaylistModel>;
  insertPlaylistAsync(request: UpsertPlaylistRequest, index: number, issuer: IUserModel): Promise<IPlaylistModel>;
  movePlaylistsAsync(playlistIndexes: number[], steps: number, issuer: IUserModel): Promise<IPlaylistModel[]>;
  moveMediasToPlaylistAsync(
    srcPlaylistId: string[],
    mediaIds: string[],
    destPlaylistId: string,
    issuer: IUserModel);
  removePlaylistAsync(playlistIndex: number, issuer: IUserModel): Promise<void>;
}

export default class PlaylistsDirector implements IPlaylistsDirector {
  getPlaylistsAsync(issuer: IUserModel): IPlaylistModel[] {
    return issuer.playlists.getAsync();
  }

  addPlaylistAsync(request: UpsertPlaylistRequest, issuer: IUserModel): Promise<IPlaylistModel> {
    return issuer.playlists.addAsync(request);
  }

  insertPlaylistAsync(request: UpsertPlaylistRequest, index: number, issuer: IUserModel): Promise<IPlaylistModel> {
    return issuer.playlists.insertAsync(request, index);
  }

  movePlaylistsAsync(playlistIndexes: number[], steps: number, issuer: IUserModel): Promise<IPlaylistModel[]> { // TODO To be tested
    return issuer.playlists.moveAsync(playlistIndexes, steps);
  }

  moveMediasToPlaylistAsync(
    srcPlaylistId: string[],
    mediaIds: string[],
    destPlaylistId: string,
    issuer: IUserModel
  ) { // TODO
  }

  removePlaylistAsync(playlistIndex: number, issuer: IUserModel): Promise<void> {
    return issuer.playlists.removeAsync(playlistIndex);
  }
}
