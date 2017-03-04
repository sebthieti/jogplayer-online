import * as ReadWriteLock from 'rwlock';
const lock = new ReadWriteLock();
import {IMediaRepository} from './media.repository';
import {IPlaylistModel, Playlist} from '../models/playlist.model';
import {User} from '../models/user.model';
import {IPlaylistDto} from '../dto/playlist.dto';
import {Medium} from '../models/medium.model';

export interface IPlaylistRepository {
  getPlaylistsAsync(issuer: User): Promise<Playlist[]>;
  getPlaylistWithMediaAsync(playlistId: string, issuer: User): Promise<Playlist>;
  getPlaylistsCountAsync(issuer: User): Promise<number>;
  getPlaylistIdsLowerThanAsync(
    index: number,
    includeSelf: boolean,
    issuer: User
  ): Promise<number[]>;
  getMediaIdsLowerThanAsync(
    playlistId: string,
    mediaIndex: number,
    includeSelf: boolean,
    issuer: User
  ): Promise<number[]>;
  getMediaCountForPlaylistByIdAsync(playlistId: string, issuer: User): Promise<number>;
  findIndexFromPlaylistIdAsync(
    playlistId: string,
    issuer: User
  ): Promise<{_id: string, index: number}>;
  getPlaylistIdIndexesAsync (issuer: User): Promise<number[]>;
  findIndexesFromPlaylistIdsAsync(
    playlistIds: number[],
    issuer: User
  ): Promise<{_id: string, index: number}[]>;
  insertMediumToPlaylistAsync(playlistId: string, medium: Medium, issuer: User): Promise<Medium>;
  insertMediaToPlaylistReturnSelfAsync(
    playlistId: string,
    media: Medium[],
    issuer: User
  ): Promise<Playlist>;
  updatePlaylistIdsPositionAsync(
    plIdIndexesToOffset: { _id: string, index: number }[],
    issuer: User
  ): Promise<Playlist[]>;
  updatePlaylistIdPositionAsync(playlistId: string, newIndex: number, issuer: User): Promise<Playlist>;
  updatePlaylistDtoAsync(playlistId: string, playlistDto: IPlaylistDto, issuer: User): Promise<Playlist>;
  removePlaylistByIdAsync(playlistId: string, issuer: User): Promise<Playlist>;
  removeMediaFromPlaylistAsync(playlistId: string, mediaId: string, issuer: User): Promise<Playlist>;
  removeAllMediaFromPlaylistAsync(playlistId: string, issuer: User): Promise<Playlist>;
}

export default class PlaylistRepository implements IPlaylistRepository {
  private Playlist: IPlaylistModel;

  constructor(playlistModel: IPlaylistModel, private mediaSaveService: IMediaRepository) {
    this.Playlist = playlistModel;
  }

  async getPlaylistsAsync(issuer: User): Promise<Playlist[]> {
    return await this.Playlist
      .find({ ownerId: issuer.id })
      .select('-media')
      .sort('index')
      .exec();
  }

  async getPlaylistWithMediaAsync(playlistId: string, issuer: User): Promise<Playlist> {
    return await this.Playlist
      .findOne({ _id: playlistId, ownerId: issuer.id })
      .populate('media')
      .exec();
  }

  async getPlaylistsCountAsync(issuer: User): Promise<number> {
    return await this.Playlist.count({ ownerId: issuer.id });
  };

  async getPlaylistIdsLowerThanAsync(
    index: number,
    includeSelf: boolean,
    issuer: User
  ): Promise<number[]> {
    const queryIndex = includeSelf ? index : index + 1;
    const playlist = await this.Playlist
      .find({ ownerId: issuer.id })
      .where('index').gte(queryIndex)
      .sort('index')
      .select('index')
      .exec();

    return await playlist[0].media.map(medium => medium.index);
  }

  async getMediaIdsLowerThanAsync(
    playlistId: string,
    mediaIndex: number,
    includeSelf: boolean,
    issuer: User
  ): Promise<number[]> {
    const queryIndex = includeSelf ? mediaIndex : mediaIndex + 1;
    const playlist = await this.Playlist
      .findOne({_id: playlistId, ownerId: issuer.id})
      .populate({
        path: 'media',
        select: '_id',
        sort: 'index',
        match: {index: {$gte: queryIndex}}
      })
      .select('media')
      .exec();

    return await playlist.media.map(medium => medium._id);
  }

  async getMediaCountForPlaylistByIdAsync(playlistId: string, issuer: User): Promise<number> {
    const playlist = await this.Playlist
      .findOne({ _id: playlistId, ownerId: issuer.id })
      .populate({
        path: 'media',
        select: '_id'
      })
      .exec();

    if (!playlist) {
      throw new Error(`PlaylistId: ${playlistId} doesn't exists`);
    }
    return playlist.media.length;
  }

  async findIndexFromPlaylistIdAsync(
    playlistId: string,
    issuer: User
  ): Promise<{_id: string, index: number}> {
    return await this.Playlist
      .findOne({ _id: playlistId, ownerId: issuer.id })
      .select('index')
      .exec();
  }

  getPlaylistIdIndexesAsync (issuer: User): Promise<number[]> {
    return this.findIndexesFromPlaylistIdsAsync(issuer);
  }

  async findIndexesFromPlaylistIdsAsync(
    playlistIds: number[],
    issuer: User
  ): Promise<{_id: string, index: number}[]> {
    return await this.Playlist
      .find({ ownerId: issuer.id })
      .whereInOrGetAll('_id', playlistIds)
      .sort('index')
      .select('index')
      .exec();
  }

  insertMediumToPlaylistAsync(playlistId: string, medium: Medium, issuer: User): Promise<Medium> {
    return new Promise<Medium>((resolve, reject) => {
      if (lock.writeLock((release) => {
        this.Playlist
          .findOne({_id: playlistId, ownerId: issuer.id})
          .populate({path: 'media', select: '_id'})
          .exec((readError, playlist) => {
            if (readError) {
              reject(readError);
            } else if (!playlist) {
              reject(`PlaylistId: ${playlistId} doesn't exists`);
            } else {
              playlist.media = playlist.media.concat(medium);
              playlist.save((writeError) => {
                if (writeError) {
                  reject(writeError);
                } else {
                  resolve(medium);
                  release();
                }
              });
            }
          });
        })) {}
    });
  }

  async insertMediaToPlaylistReturnSelfAsync(
    playlistId: string,
    media: Medium[],
    issuer: User
  ): Promise<Playlist> {
    const playlist = await this.Playlist
      .findOne({ _id: playlistId, ownerId: issuer.id })
      .populate({ path: 'media', select: '_id' })
      .exec();

    playlist.media = playlist.media.concat(media);
    return await playlist.save();
  }

  updatePlaylistIdsPositionAsync(
    plIdIndexesToOffset: { _id: string, index: number }[],
    issuer: User
  ): Promise<Playlist[]> {
    const updatePlaylistIdPositionPromises = plIdIndexesToOffset.map(value =>
      this.updatePlaylistIdPositionAsync(value._id, value.index, issuer)
    );
    return Promise.all(updatePlaylistIdPositionPromises);
  }

  async updatePlaylistIdPositionAsync(playlistId: string, newIndex: number, issuer: User): Promise<Playlist> {
    const playlist = await this.Playlist
      .findOne({ _id: playlistId, ownerId: issuer.id })
      .select('index')
      .exec();

    playlist.index = newIndex;
    return await playlist.save();
  }

  async updatePlaylistDtoAsync(
    playlistId: string,
    playlistDto: IPlaylistDto,
    issuer: User
  ): Promise<Playlist> {
    return await this.Playlist
      .findOneAndUpdate(
        { _id: playlistId, ownerId: issuer.id },
        playlistDto.getDefinedFields(),
        { 'new': true } // Return modified doc.
      )
      .populate('media')
      .exec();
  }

  async removePlaylistByIdAsync(playlistId: string, issuer: User): Promise<Playlist> {
    const playlist = await this.Playlist
      .findOne({ _id: playlistId, ownerId: issuer.id })
      .populate({ path: 'media', select: '_id' })
      .exec();

    const removePromises = playlist.media.map(medium =>
      this.mediaSaveService.removeMediumAsync(medium, issuer)
    );

    await Promise.all(removePromises);
    return await playlist.remove();
  }

  async removeMediaFromPlaylistAsync(playlistId: string, mediaId: string, issuer: User): Promise<Playlist> {
    const playlist = await this.Playlist
      .findOne({ _id: playlistId, ownerId: issuer.id })
      .populate('media')
      .exec();

    await this.mediaSaveService.removeMediumByIdAsync(mediaId);

    playlist.media = playlist.media.filter(medium => `${medium._id}` !== mediaId);

    return await playlist.save();
  }

  async removeAllMediaFromPlaylistAsync(playlistId: string, issuer: User): Promise<Playlist> {
    const playlist = await this.Playlist
      .findOne({ _id: playlistId, ownerId: issuer.id })
      .populate({
        path: 'media',
        select: '_id'
      })
      .exec();

    await this.mediaSaveService.removeMediaAsync(playlist.media, issuer);

    playlist.media = [];
    return await playlist.save();
  }
}
