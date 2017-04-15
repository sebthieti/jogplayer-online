import {IMediumModel} from '../models/medium.model';
import {UpsertPlaylistRequest} from '../requests/updatePlaylist.request';
import {IUserModel} from '../models/user.model';
import {IPlaylistModel} from '../models/playlist.model';
import {ObjectID} from 'mongodb';

export interface IPlaylistDirector {
  updatePlaylistAsync(
    playlistIndex: number,
    playlistRequest: UpsertPlaylistRequest,
    issuer: IUserModel): Promise<IPlaylistModel>;
  getMediaFromPlaylistByIndexAsync(
    playlistIndex: number,
    issuer: IUserModel
  ): Promise<IMediumModel[]>;
  addMediumByFilePathAsync(
    playlistIndex: number,
    mediaFilePath: string,
    issuer: IUserModel
  ): Promise<IMediumModel>;
  insertMediumByFilePathAsync(
    playlistIndex: number,
    mediaFilePath: string,
    index: number,
    issuer: IUserModel
  ): Promise<IMediumModel>;
  removeMediaAsync(
    playlistIndex: number,
    mediumId: string,
    issuer: IUserModel
  ): Promise<void>;
}

export default class PlaylistDirector implements IPlaylistDirector {
  updatePlaylistAsync(
    playlistIndex: number,
    playlistRequest: UpsertPlaylistRequest,
    issuer: IUserModel
  ): Promise<IPlaylistModel> {
    return issuer.playlists.getByIndex(playlistIndex).updateFromRequestAsync(playlistRequest);

    // TODO Exception can happen in case playlist doesn't exists anymore
  }

  getMediaFromPlaylistByIndexAsync(playlistIndex: number, issuer: IUserModel): Promise<IMediumModel[]> {
    return issuer.playlists.getByIndex(playlistIndex).media.valueAsync;
  }

  addMediumByFilePathAsync(playlistIndex: number, mediaFilePath: string, issuer: IUserModel): Promise<IMediumModel> {
    return issuer.playlists.getByIndex(playlistIndex).addMediumByFilePathAsync(mediaFilePath);
  }

  async insertMediumByFilePathAsync(
    playlistIndex: number,
    mediaFilePath: string,
    index: number,
    issuer: IUserModel
  ): Promise<IMediumModel> {
    return issuer.playlists.getByIndex(playlistIndex).insertMediumByFilePathAsync(mediaFilePath, index);
  }

  removeMediaAsync(playlistIndex: number, mediumId: string, issuer: IUserModel): Promise<void> {
    return issuer.playlists.getByIndex(playlistIndex).removeMediaAsync(new ObjectID(mediumId));
  }
}
