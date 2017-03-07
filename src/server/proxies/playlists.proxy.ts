import {ICache} from './cache';
import {IEvents} from '../events/index';
import {IPlaylistRepository} from '../repositories/playlist.repository';
import {User} from '../models/user.model';
import {Playlist} from '../models/playlist.model';

export interface IPlaylistsProxy {
  getPlaylistsCountAsync(user: User): Promise<number>;
  saveNewPlaylist(playlist: Playlist, user: User): Promise<Playlist>;
  getPlaylistsAsync(user: User): Promise<Playlist[]>;
  getPlaylistIdIndexesAsync(user: User): { _id: string, index: number }[];
  getPlaylistIdsLowerThanAsync(desiredIndex: number, includeSelf: boolean, issuer: User): Promise<number[]>;
  playlistsPositionChangeByUserId(userId: string);
  removePlaylistByIdAsync(playlistId: string, issuer: User): Promise<void>;
}

export default class PlaylistsProxy implements IPlaylistsProxy {
  private PLAYLIST_GROUP = 'playlist';
  private PLAYLIST_COUNT_GROUP = 'playlists.count';
  private PLAYLIST_ID_INDEXES_GROUP = 'playlistId.indexes';
  private PLAYLIST_IDS_LOWER_THAN = 'playlistIdsLowerThan';

  constructor(
    private cache: ICache,
    private events: IEvents,
    private playlistSaveService: IPlaylistRepository
  ) {
    events.onPlaylistUpdate(userId =>
      this.playlistsPositionChangeByUserId(userId)
    );
  }

  async getPlaylistsCountAsync(user: User): Promise<number> {
    const playlistCountFromCache = this.cache.getItemFromCache<number>(
      this.PLAYLIST_COUNT_GROUP,
      user.id
    );
    if (playlistCountFromCache != null) {
      return playlistCountFromCache;
    } else {
      const count = await this.playlistSaveService
        .getPlaylistsCountAsync(user);

      this.cache.createOrUpdateItem(
        this.PLAYLIST_COUNT_GROUP,
        user.id,
        count
      );
      return count;
    }
  }

  async saveNewPlaylist(playlist: Playlist, user: User): Promise<Playlist> {
    const updatedPlaylist = await playlist.save();
    this.events.emitPlaylistsInsert({
      playlist: updatedPlaylist,
      user: user
    });
    return updatedPlaylist;
  }

  getPlaylistsAsync(user: User): Promise<Playlist[]> {
    return this.playlistSaveService.getPlaylistsAsync(user);
  }

  async getPlaylistIdIndexesAsync(user: User): Promise<{ _id: string, index: number }[]> {
    const playlistIdIndexes = this.cache.getItemFromCache<{ _id: string, index: number }[]>(
      this.PLAYLIST_ID_INDEXES_GROUP,
      user.id
    );
    if (playlistIdIndexes != null) {
      return playlistIdIndexes;
    } else {
      const playlistIdIndexes = await this.playlistSaveService
        .getPlaylistIdIndexesAsync(user);

      this.cache.createOrUpdateItem(
        this.PLAYLIST_ID_INDEXES_GROUP,
        user.id,
        playlistIdIndexes
      );
      return playlistIdIndexes;
    }
  }

  async getPlaylistIdsLowerThanAsync(
    desiredIndex: number,
    includeSelf: boolean,
    issuer: User
  ): Promise<number[]> {
    const compositeKey = {
      index: desiredIndex,
      includeSelf: includeSelf,
      issuerId: issuer.id
    };
    const playlistIdsLowerThanArray = this.cache.getItemFromCache<number[]>(
      this.PLAYLIST_IDS_LOWER_THAN,
      'entities'
    );
    const playlistIdsLowerThanFromCache = playlistIdsLowerThanArray.find(pl => {
        return pl.key.issuerId === compositeKey.issuerId &&
          pl.key.includeSelf === compositeKey.includeSelf &&
          pl.key.index === compositeKey.index;
      }) || null;
    if (playlistIdsLowerThanFromCache != null) {
      return playlistIdsLowerThanFromCache.value;
    } else {
      const plIdIndexesToOffset = await this.playlistSaveService
        .getPlaylistIdsLowerThanAsync(desiredIndex, includeSelf, issuer);

      if (playlistIdsLowerThanArray != null) {
        playlistIdsLowerThanArray.push({
          key: compositeKey,
          value: plIdIndexesToOffset
        });
      } else {
        this.cache.createOrUpdateItem(this.PLAYLIST_IDS_LOWER_THAN, 'entities', [{
          key: compositeKey,
          value: plIdIndexesToOffset
        }]);
      }
      return plIdIndexesToOffset;
    }
  }

  async playlistsPositionChangeByUserId(userId: string) {
    let playlistIdsLowerThan = this.cache.getItemFromCache<number[]>(
      this.PLAYLIST_IDS_LOWER_THAN,
      'entities'
    );
    playlistIdsLowerThan = playlistIdsLowerThan
      .filter(obj => obj.key.issuerId !== userId);
    this.cache.createOrUpdateItem(this.PLAYLIST_IDS_LOWER_THAN, 'entities', playlistIdsLowerThan);
  }

  async removePlaylistByIdAsync(playlistId: string, issuer: User): Promise<void> {
    await this.playlistSaveService.removePlaylistByIdAsync(playlistId, issuer);
    this.events.emitPlaylistsRemove(playlistId);
  }

  private invalidatePlaylistById(playlistId) {
    this.cache.removeItem(this.PLAYLIST_GROUP, playlistId);
  }
}
