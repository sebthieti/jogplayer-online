import {ICache} from './cache';
import {IEvents} from '../events/index';
import {IPlaylistRepository} from '../repositories/playlist.repository';
import {IPlaylistDto} from '../dto/playlist.dto';
import {User} from '../models/user.model';
import {Playlist} from '../models/playlist.model';
import {MediumDocument} from '../models/medium.model';

export interface IPlaylistProxy {
  updatePlaylistDtoAsync(playlistId: string, playlistDto: IPlaylistDto, issuer: User): Promise<Playlist>;
  getPlaylistWithMediaAsync(playlistId: string, issuer: User): Promise<Playlist>;
  removeAllMediaFromPlaylistAsync(playlist: Playlist, issuer: User): Promise<Playlist>;
  getMediaCountForPlaylistByIdAsync(playlistId: string, issuer: User): Promise<number>;
  insertMediumToPlaylistAsync(playlistId: string, unlinkedMedium: MediumDocument, issuer: User): Promise<MediumDocument>;
  updatePlaylistIdsPositionAsync(
    plIdIndexesToOffset: { _id: string, index: number }[],
    issuer: User
  ): Promise<Playlist[]>;
  getPlaylistsCountAsync(issuer: User): Promise<number>;
  removeMediaFromPlaylistAsync(playlistId: string, mediaId: string, issuer: User): Promise<Playlist>;
  getMediaIdsLowerThanAsync(
    playlistId: string,
    mediaIndex: number,
    includeSelf: boolean,
    issuer: User
  ): { _id: string, index: number }[];
  insertMediaToPlaylistReturnSelfAsync(
    emptyPlaylistId: string,
    media: MediumDocument[],
    issuer: User
  ): Promise<Playlist>;
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
      this.playlistInserted(playlistInfos.playlist)
    );
    events.onPlaylistsRemove(playlistId =>
      this.playlistRemovedById(playlistId)
    );
  }

  async updatePlaylistDtoAsync(playlistId: string, playlistDto: IPlaylistDto, issuer: User): Promise<Playlist> {
    const playlist = await this.playlistSaveService.updatePlaylistDtoAsync(
      playlistId,
      playlistDto,
      issuer
    );
    this.cache.createOrUpdateItem(this.PLAYLIST_GROUP, playlist.id, playlist);
    return playlist;
  }

  async getPlaylistWithMediaAsync(playlistId: string, issuer: User): Promise<Playlist> {
    const playlist = this.cache.getItemFromCache<Playlist>(this.PLAYLIST_GROUP, playlistId);
    if (playlist != null) {
      return playlist;
    } else {
      const playlist = await this.playlistSaveService
        .getPlaylistWithMediaAsync(playlistId, issuer);
      this.cache.createOrUpdateItem(this.PLAYLIST_GROUP, playlistId, playlist);
      return playlist;
    }
  }

  async removeAllMediaFromPlaylistAsync(playlist: Playlist, issuer: User): Promise<Playlist> {
    const updatedPlaylist = await this.playlistSaveService.removeAllMediaFromPlaylistAsync(
      playlist.id,
      issuer
    );
    this.cache.createOrUpdateItem(this.PLAYLIST_GROUP, updatedPlaylist.id, updatedPlaylist);
    this.cache.createOrUpdateItem(this.PLAYLIST_MEDIA_COUNT_GROUP, updatedPlaylist.id, 0);
    return updatedPlaylist;
  }

  async getMediaCountForPlaylistByIdAsync(playlistId: string, issuer: User): Promise<number> {
    const playlistMediaCountFromCache = this.cache.getItemFromCache<number>(
      this.PLAYLIST_MEDIA_COUNT_GROUP,
      playlistId
    );
    if (playlistMediaCountFromCache != null) {
      return playlistMediaCountFromCache;
    } else {
      const cnt = await this.playlistSaveService
        .getMediaCountForPlaylistByIdAsync(playlistId, issuer);
      this.cache.createOrUpdateItem(this.PLAYLIST_MEDIA_COUNT_GROUP, playlistId, cnt);
      return cnt;
    }
  }

  async insertMediumToPlaylistAsync(
    playlistId: string,
    unlinkedMedium: MediumDocument,
    issuer: User
  ): Promise<MediumDocument> {
    const media = await this.playlistSaveService
      .insertMediumToPlaylistAsync(playlistId, unlinkedMedium, issuer);
    this.cache.removeItem(this.PLAYLIST_GROUP, playlistId);
    return media;
  }

  async updatePlaylistIdsPositionAsync(
    plIdIndexesToOffset: { _id: string, index: number }[],
    issuer: User
  ): Promise<Playlist[]> {
    const updatedPlaylists = await this.playlistSaveService
      .updatePlaylistIdsPositionAsync(plIdIndexesToOffset, issuer);
    updatedPlaylists.forEach(playlist => {
      this.cache.createOrUpdateItem(this.PLAYLIST_GROUP, playlist.id, playlist);
    });
    this.events.emitPlaylistUpdate(issuer.id);
    return updatedPlaylists;
  }

  async getPlaylistsCountAsync(issuer: User): Promise<number> {
    const playlistCount = this.cache.getItemFromCache<number>(this.PLAYLIST_COUNT_GROUP, issuer.id);
    if (playlistCount != null) {
      return playlistCount;
    } else {
      const count = await this.playlistSaveService
        .getPlaylistsCountAsync(issuer);
      this.cache.createOrUpdateItem(this.PLAYLIST_COUNT_GROUP, issuer.id, count);
      return playlistCount;
    }
  }

  async removeMediaFromPlaylistAsync(playlistId: string, mediaId: string, issuer: User): Promise<Playlist> {
    const playlist = await this.playlistSaveService
      .removeMediaFromPlaylistAsync(playlistId, mediaId, issuer);

    this.cache.createOrUpdateItem(this.PLAYLIST_GROUP, playlistId, playlist);
    this.cache.createOrUpdateItem(this.PLAYLIST_MEDIA_COUNT_GROUP, playlist.id, playlist.media.length);
    return playlist;
  }

  async getMediaIdsLowerThanAsync(
    playlistId: string,
    mediaIndex: number,
    includeSelf: boolean,
    issuer: User
  ): { _id: string, index: number }[] {
    const compositeKey = {
      playlistId: playlistId,
      mediaIndex: mediaIndex,
      includeSelf: includeSelf,
      issuerId: issuer.id
    };

    const mediaIdsLowerThanArray = this.cache.getItemFromCache<any[]>(
      this.MEDIA_IDS_LOWER_THAN,
        'entities'
      ) || [];
    const playlistCountFromCache = mediaIdsLowerThanArray
      .find(pl => {
        return pl.key.playlistId === compositeKey.playlistId &&
          pl.key.mediaIndex === compositeKey.mediaIndex &&
          pl.key.includeSelf === compositeKey.includeSelf &&
          pl.key.issuerId === compositeKey.issuerId;
      }) || null;

    if (playlistCountFromCache != null) {
      return playlistCountFromCache.value;
    } else {
      const mediaIdIndexesToOffset = await this.playlistSaveService
        .getMediaIdsLowerThanAsync(playlistId, mediaIndex, includeSelf, issuer);

      let mediaIdsLowerThanArrayCache = this.cache.createOrUpdateItem(this.MEDIA_IDS_LOWER_THAN, 'entities', []);
      mediaIdsLowerThanArrayCache.value.push({
        key: compositeKey,
        value: mediaIdIndexesToOffset
      });

      return mediaIdIndexesToOffset;
    }
  }

  async insertMediaToPlaylistReturnSelfAsync(
    emptyPlaylistId: string,
    media: MediumDocument[],
    issuer: User
  ): Promise<Playlist> {
    const playlist = await this.playlistSaveService
      .insertMediaToPlaylistReturnSelfAsync(
        emptyPlaylistId,
        media,
        issuer
      );
    this.cache.createOrUpdateItem(this.PLAYLIST_GROUP, playlist.id, playlist);
    this.cache.createOrUpdateItem(this.PLAYLIST_MEDIA_COUNT_GROUP, playlist.id, playlist.media.length);
    return playlist;
  };

  private playlistRemovedById(playlistId: string) {
    this.invalidatePlaylistById(playlistId);
  }

  private playlistInserted(playlist: Playlist) {
    this.cache.createOrUpdateItem(this.PLAYLIST_GROUP, playlist.id, playlist);
  }

  private invalidatePlaylistById(playlistId: string) {
    this.cache.removeItem(this.PLAYLIST_GROUP, playlistId); // .createOrUpdateItem(PLAYLIST_GROUP, playlistId, null);
    this.cache.removeItem(this.PLAYLIST_MEDIA_COUNT_GROUP, playlistId);
  }
}
