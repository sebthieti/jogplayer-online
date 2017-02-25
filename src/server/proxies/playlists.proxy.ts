import {ICache} from './cache';
import {IEvents} from '../events/index';
import {IPlaylistRepository} from '../repositories/playlist.repository';

export interface IPlaylistsProxy {
  getPlaylistsCountAsync(user);
  saveNewPlaylist(playlist, user);
  getPlaylistsAsync(user);
  getPlaylistIdIndexesAsync(user);
  getPlaylistIdsLowerThanAsync(desiredIndex, includeSelf, issuer);
  playlistsPositionChangeByUserId(userId);
  removePlaylistByIdAsync(playlistId, issuer);
  invalidatePlaylistById(playlistId);
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

  getPlaylistsCountAsync(user) {
    const playlistCountFromCache = this.cache.getItemFromCache(
      this.PLAYLIST_COUNT_GROUP,
      user.id
    );
    if (playlistCountFromCache != null) {
      return Promise.resolve(playlistCountFromCache);
    } else {
      return this.playlistSaveService
        .getPlaylistsCountAsync(user)
        .then(cnt => {
          this.cache.createOrUpdateItem(
            this.PLAYLIST_COUNT_GROUP,
            user.id,
            cnt
          );
          return cnt;
        });
    }
  }

  saveNewPlaylist(playlist, user) {
    return playlist.save()
      .then(playlist => {
        this.events.emitPlaylistsInsert({
          playlist: playlist,
          user: user
        });
        return playlist;
      });
  }

  getPlaylistsAsync(user) {
    return this.playlistSaveService.getPlaylistsAsync(user);
  }

  getPlaylistIdIndexesAsync(user) {
    const playlistIdIndexes = this.cache.getItemFromCache(
      this.PLAYLIST_ID_INDEXES_GROUP,
      user.id
    );
    if (playlistIdIndexes != null) {
      return Promise.resolve(playlistIdIndexes);
    } else {
      this.playlistSaveService
        .getPlaylistIdIndexesAsync(user)
        .then(playlistIdIndexes => {
          this.cache.createOrUpdateItem(
            this.PLAYLIST_ID_INDEXES_GROUP,
            user.id,
            playlistIdIndexes
          );
          return playlistIdIndexes;
        });
    }
  }

  getPlaylistIdsLowerThanAsync(desiredIndex, includeSelf, issuer) {
    const compositeKey = {
      index: desiredIndex,
      includeSelf: includeSelf,
      issuerId: issuer.id
    };
    const playlistIdsLowerThanArray = this.cache.getItemFromCache(this.PLAYLIST_IDS_LOWER_THAN, 'entities');
    const playlistIdsLowerThanFromCache = playlistIdsLowerThanArray
      .find(pl => {
        return pl.key.issuerId === compositeKey.issuerId &&
          pl.key.includeSelf === compositeKey.includeSelf &&
          pl.key.index === compositeKey.index;
      }) || null;
    if (playlistIdsLowerThanFromCache != null) {
      return Promise.resolve(playlistIdsLowerThanFromCache.value);
    } else {
      return this.playlistSaveService
        .getPlaylistIdsLowerThanAsync(desiredIndex, includeSelf, issuer)
        .then(plIdIndexesToOffset => {
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
        });
    }
  }

  playlistsPositionChangeByUserId(userId) {
    let playlistIdsLowerThan = this.cache.getItemFromCache(
      this.PLAYLIST_IDS_LOWER_THAN,
      'entities'
    );
    playlistIdsLowerThan = playlistIdsLowerThan
      .filter(obj => {
        return obj.key.issuerId !== userId;
      })
      .toArray();
    this.cache.createOrUpdateItem(this.PLAYLIST_IDS_LOWER_THAN, 'entities', playlistIdsLowerThan);
  }

  removePlaylistByIdAsync(playlistId, issuer) {
    return this.playlistSaveService
      .removePlaylistByIdAsync(playlistId, issuer)
      .then(() => {
        this.events.emitPlaylistsRemove(playlistId);
      });
  }

  invalidatePlaylistById(playlistId) {
    this.cache.removeItem(this.PLAYLIST_GROUP, playlistId);
  }
}
