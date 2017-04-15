import {IMongoDbContext} from './mongoDb.context';
import {Playlist} from '../entities/playlist';
import {ObjectID} from 'mongodb';

export interface IPlaylistRepository {
  getPlaylistsAsync(userId: ObjectID): Promise<Playlist[]>;
  insertMediumToPlaylistAsync(
    playlistIndex: number,
    mediumId: ObjectID,
    userId: ObjectID
  ): Promise<ObjectID>;
  insertMediaToPlaylistReturnSelfAsync(
    playlistIndex: number,
    mediaIds: ObjectID[],
    userId: ObjectID
  ): Promise<Playlist>;
  addPlaylistAsync(playlist: Playlist, userId: ObjectID): Promise<Playlist>;
  insertPlaylistAsync(
    playlist: Playlist,
    index: number,
    userId: ObjectID): Promise<Playlist>;
  updatePlaylistAsync(
    playlistIndex: number,
    playlist: Playlist,
    userId: ObjectID
  ): Promise<Playlist>;
  removePlaylistByIndexAsync(playlistIndex: number, userId: ObjectID): Promise<void>;
  removeMediumFromPlaylistAsync(
    playlistIndex: number,
    mediumId: ObjectID,
    userId: ObjectID
  ): Promise<Playlist>;
}

export default class PlaylistRepository implements IPlaylistRepository {
  constructor(private dbContext: IMongoDbContext) {}

  async getPlaylistsAsync(userId: ObjectID): Promise<Playlist[]> {
    return this.dbContext
      .users
      .findOne({ _id: userId }, { fields: { playlists: 1 }})
  }

  async getPlaylistIdsLowerThanAsync(
    index: number,
    includeSelf: boolean,
    userId: ObjectID
  ): Promise<number[]> {
    const queryIndex = includeSelf ? index : index + 1;
    const playlists = await this.dbContext
      .users
      .findOne({ _id: userId }, { fields: { playlists: 1 } });

    return (playlists as Playlist[])
      .map((_, index) => index)
      .filter(index => index > queryIndex);
  }

  async addPlaylistAsync(playlist: Playlist, userId: ObjectID): Promise<Playlist> {
    const result = await this.dbContext
      .users
      .findOneAndUpdate(
        { _id: userId },
        { $push: { playlists: playlist }},
        { projection: { playlists: 1 } }
      );

    const playlists = result.value.playlists as Playlist[];
    return playlists[playlists.length - 1];
  }

  async insertPlaylistAsync(
    playlist: Playlist,
    index: number,
    userId: ObjectID
  ): Promise<Playlist> {
    let updateDbReq = { $set: {} };
    updateDbReq.$set[`playlists.${index}`] = playlist;

    const result = await this.dbContext
      .users
      .findOneAndUpdate(
        { _id: userId },
        updateDbReq,
        { projection: { playlists: 1 }, returnOriginal: false }
      );

    const playlists = result.value.playlists as Playlist[];
    return playlists[index];
  }

  async insertMediumToPlaylistAsync(
    playlistIndex: number,
    mediumId: ObjectID,
    userId: ObjectID
  ): Promise<ObjectID> {
    let updateDbReq = { $push: {} };
    updateDbReq.$push[`playlists.${playlistIndex}.mediaIds`] = mediumId;

    const result = await this.dbContext.users
      .findOneAndUpdate(
        { _id: userId },
        updateDbReq,
        { projection: { playlists: 1 }, returnOriginal: false }
      );

    const playlists = result.value.playlists as Playlist[];
    const mediaIds = playlists[playlistIndex].mediaIds;
    return mediaIds[mediaIds.length-1];
  }

  async insertMediaToPlaylistReturnSelfAsync(
    playlistIndex: number,
    mediaIds: ObjectID[],
    userId: ObjectID
  ): Promise<Playlist> {
    let playlists: Playlist[] = await this.dbContext.users.findOne(
      { _id: userId },
      { fields: { playlists: 1 } }
    );

    playlists[playlistIndex].mediaIds.concat(mediaIds);

    const result = await this.dbContext.users
      .findOneAndUpdate(
        { _id: userId },
        { playlists: playlists },
        { projection: { playlists: 1 }, returnOriginal: false }
      );

    const updatedPlaylists = result.value.playlists as Playlist[];
    return updatedPlaylists[playlistIndex];
  }

  async updatePlaylistAsync(
    playlistIndex: number,
    playlist: Playlist,
    userId: ObjectID
  ): Promise<Playlist> {
    let updateDbReq = { $set: {} };
    updateDbReq.$set[`playlists.${playlistIndex}`] = playlist;

    const result = await this.dbContext
      .users
      .findOneAndUpdate(
        { _id: userId },
        updateDbReq,
        { projection: { playlists: 1 }, returnOriginal: false }
      );

    const playlists = result.value.playlists as Playlist[];
    return playlists[playlistIndex];
  }

  async removePlaylistByIndexAsync(playlistIndex: number, userId: ObjectID): Promise<void> {
    const updateDbReq = { $unset: {} };
    updateDbReq.$unset[`playlists.${playlistIndex}`] = 1;

    await this.dbContext.users.update(
      { _id: userId },
      updateDbReq
    );

    await this.dbContext.users.update(
      { _id: userId },
      {$pull : { playlists : null }}
    );
  }

  async removeMediumFromPlaylistAsync(
    playlistIndex: number,
    mediumId: ObjectID,
    userId: ObjectID
  ): Promise<Playlist> {
    let updateDbReq = { $pull: {} };
    updateDbReq.$pull[`playlists.${playlistIndex}.mediaIds`] = mediumId;

    const result = await this.dbContext
      .users
      .findOneAndUpdate(
        { _id: userId },
        updateDbReq,
        { projection: { playlists: 1 }, returnOriginal: false }
      );

    const playlists = result.value.playlists as Playlist[];
    return playlists[playlistIndex];
  }
}
