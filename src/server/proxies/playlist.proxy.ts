import {ICache} from './cache';
import {IEvents} from '../events/index';
import {IPlaylistRepository} from '../repositories/playlist.repository';

export interface IPlaylistProxy {
  updatePlaylistDtoAsync(playlistId, playlistDto, issuer);
  getPlaylistWithMediaAsync(playlistId, issuer);
  removeAllMediaFromPlaylistAsync(playlist, issuer);
  getMediaCountForPlaylistByIdAsync(playlistId, issuer);
  insertMediumToPlaylistAsync(playlistId, unlinkedMedium, issuer);
  updatePlaylistIdsPositionAsync(plIdIndexesToOffset, issuer);
  getPlaylistsCountAsync(issuer);
  removeMediaFromPlaylistAsync(playlistId, mediaId, issuer);
  getMediaIdsLowerThanAsync(playlistId, mediaIndex, includeSelf, issuer);
  insertMediaToPlaylistReturnSelfAsync(emptyPlaylistId, media, issuer);
  playlistRemovedById(playlistId);
  playlistInserted(playlist);
  invalidatePlaylistById(playlistId);
}

export default class PlaylistProxy implements IPlaylistProxy {
  private PLAYLIST_GROUP = 'playlist';
  private PLAYLIST_COUNT_GROUP = 'playlist.count';
  private PLAYLIST_MEDIA_COUNT_GROUP = 'playlist.media.count';
  private MEDIA_IDS_LOWER_THAN = 'mediaIdsLowerThan';

  constructor(
    private cache: ICache,
    private events: IEvents,
    private playlistSaveService: IPlaylistRepository
  ) {
    events.onPlaylistsInsert(playlistInfos =>
      this.playlistInserted(playlistInfos)
    );
    events.onPlaylistsRemove(playlistId =>
      this.playlistRemovedById(playlistId)
    );
  }

  updatePlaylistDtoAsync(playlistId, playlistDto, issuer) {
    return this.playlistSaveService
      .updatePlaylistDtoAsync(playlistId, playlistDto, issuer)
      .then(playlist => {
        this.cache.createOrUpdateItem(this.PLAYLIST_GROUP, playlist.id, playlist);
        return playlist;
      });
  }

  getPlaylistWithMediaAsync(playlistId, issuer) {
    const playlist = this.cache.getItemFromCache(this.PLAYLIST_GROUP, playlistId);
    if (playlist != null) {
      return Promise.resolve(playlist);
    } else {
      return this.playlistSaveService
        .getPlaylistWithMediaAsync(playlistId, issuer)
        .then(playlist => {
          this.cache.createOrUpdateItem(this.PLAYLIST_GROUP, playlistId, playlist);
          return playlist;
        });
    }
  }

  removeAllMediaFromPlaylistAsync(playlist, issuer) {
    return this.playlistSaveService
      .removeAllMediaFromPlaylistAsync(playlist.id, issuer)
      .then(playlist => {
        this.cache.createOrUpdateItem(this.PLAYLIST_GROUP, playlist.id, playlist);
        this.cache.createOrUpdateItem(this.PLAYLIST_MEDIA_COUNT_GROUP, playlist.id, 0);
        return playlist;
      });
  }

  getMediaCountForPlaylistByIdAsync(playlistId, issuer) {
    const playlistMediaCountFromCache = this.cache.getItemFromCache(this.PLAYLIST_MEDIA_COUNT_GROUP, playlistId);
    if (playlistMediaCountFromCache != null) {
      return Promise.resolve(playlistMediaCountFromCache);
    } else {
      return this.playlistSaveService
        .getMediaCountForPlaylistByIdAsync(playlistId, issuer)
        .then(cnt => {
          this.cache.createOrUpdateItem(this.PLAYLIST_MEDIA_COUNT_GROUP, playlistId, cnt);
          return cnt;
        });
    }
  }

  insertMediumToPlaylistAsync(playlistId, unlinkedMedium, issuer) {
    return this.playlistSaveService
      .insertMediumToPlaylistAsync(playlistId, unlinkedMedium, issuer)
      .then(media => {
        this.cache.removeItem(this.PLAYLIST_GROUP, playlistId);
        return media;
      });
  }

  updatePlaylistIdsPositionAsync(plIdIndexesToOffset, issuer) {
    return this.playlistSaveService
      .updatePlaylistIdsPositionAsync(plIdIndexesToOffset, issuer)
      .then(updatedPlaylists => {
        updatedPlaylists.forEach(playlist => {
          this.cache.createOrUpdateItem(this.PLAYLIST_GROUP, playlist.id, playlist);
        });
        this.events.emitPlaylistUpdate(issuer.id);
        return updatedPlaylists;
      });
  }

  getPlaylistsCountAsync(issuer) {
    const playlistCount = this.cache.getItemFromCache(this.PLAYLIST_COUNT_GROUP, issuer.id);
    if (playlistCount != null) {
      return Promise.resolve(playlistCount);
    } else {
      return this.playlistSaveService
        .getPlaylistsCountAsync(issuer)
        .then(count => {
          this.cache.createOrUpdateItem(this.PLAYLIST_COUNT_GROUP, issuer.id, count);
          return playlistCount;
        });
    }
  }

  removeMediaFromPlaylistAsync(playlistId, mediaId, issuer) {
    return this.playlistSaveService
      .removeMediaFromPlaylistAsync(playlistId, mediaId, issuer)
      .then(playlist => {
        this.cache.createOrUpdateItem(this.PLAYLIST_GROUP, playlistId, playlist);
        this.cache.createOrUpdateItem(this.PLAYLIST_MEDIA_COUNT_GROUP, playlist.id, playlist.media.length);
        return playlist;
      });
  }

  getMediaIdsLowerThanAsync(playlistId, mediaIndex, includeSelf, issuer) {
    const compositeKey = {
      playlistId: playlistId,
      mediaIndex: mediaIndex,
      includeSelf: includeSelf,
      issuerId: issuer.id
    };

    let mediaIdsLowerThanArray = this.cache.getItemFromCache(this.MEDIA_IDS_LOWER_THAN, 'entities') || [];
    const playlistCountFromCache = mediaIdsLowerThanArray
      .find(pl => {
        return pl.key.playlistId === compositeKey.playlistId &&
          pl.key.mediaIndex === compositeKey.mediaIndex &&
          pl.key.includeSelf === compositeKey.includeSelf &&
          pl.key.issuerId === compositeKey.issuerId;
      }) || null;

    if (playlistCountFromCache != null) {
      return Promise.resolve(playlistCountFromCache.value);
    } else {
      return this.playlistSaveService
        .getMediaIdsLowerThanAsync(playlistId, mediaIndex, includeSelf, issuer)
        .then(mediaIdIndexesToOffset => {
          mediaIdsLowerThanArray = this.cache.createOrUpdateItem(this.MEDIA_IDS_LOWER_THAN, 'entities', []);
          mediaIdsLowerThanArray.value.push({
            key: compositeKey,
            value: mediaIdIndexesToOffset
          });

          return mediaIdIndexesToOffset;
        });
    }
  }

  insertMediaToPlaylistReturnSelfAsync(emptyPlaylistId, media, issuer) {
    return this.playlistSaveService
      .insertMediaToPlaylistReturnSelfAsync(
        emptyPlaylistId,
        media,
        issuer
      ).then(playlist => {
        this.cache.createOrUpdateItem(this.PLAYLIST_GROUP, playlist.id, playlist);
        this.cache.createOrUpdateItem(this.PLAYLIST_MEDIA_COUNT_GROUP, playlist.id, playlist.media.length);
        return playlist;
      });
  };

  playlistRemovedById(playlistId) {
    this.invalidatePlaylistById(playlistId);
  }

  playlistInserted(playlist) {
    this.cache.createOrUpdateItem(this.PLAYLIST_GROUP, playlist.id, playlist);
  }

  invalidatePlaylistById(playlistId) {
    this.cache.removeItem(this.PLAYLIST_GROUP, playlistId); // .createOrUpdateItem(PLAYLIST_GROUP, playlistId, null);
    this.cache.removeItem(this.PLAYLIST_MEDIA_COUNT_GROUP, playlistId);
  }
}
