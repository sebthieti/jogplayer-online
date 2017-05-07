import {Playlist} from '../entities/playlist';
import PlaylistRepository, {UpsertPlaylist} from '../repositories/playlist.repository';
import MediumModel from './medium.model';
import {FileExplorerRepository} from '../repositories/fileExplorer.repository';
import MediaQueueService from '../services/mediaQueue.service';

export default class PlaylistModel {
  index: number;
  name: string;
  isAvailable: boolean;
  media: MediumModel[] = [];

  private original: Playlist;

  constructor(
    private repository: PlaylistRepository,
    private fileExplorer: FileExplorerRepository,
    private mediaQueueService: MediaQueueService,
    playlist?: Playlist
  ) {
    Object.assign(this, playlist);
    Object.assign(this.original, {}, playlist);
  }

  async getMedia(): Promise<MediumModel[]> {
    const media = await this.repository.getMedia(this.index);
    const models = media.map(medium => new MediumModel(
      this.fileExplorer,
      this.mediaQueueService,
      medium
    ));
    this.media = this.media.concat(models);
    return models;
  }

  async getMediumFromUrl(url: string): Promise<MediumModel> {
    const medium = await this.repository.getMediumByPath(url);
    return new MediumModel(this.fileExplorer, this.mediaQueueService, medium);
  }

  findMediumIndex(medium: MediumModel): number {
    return this.media.indexOf(medium);
  }

  hasMedium(medium: MediumModel): boolean {
    return this.media.indexOf(medium) !== -1;
  }

  async addMediumByFilePathToPlaylist(filePath: string): Promise<MediumModel> {
    const medium = await this.repository.addMedium(this.index, filePath);
    const position = this.media.push(new MediumModel(this.fileExplorer, this.mediaQueueService, medium));
    return this.media[position];
  }

  async insertMediumByFilePathToPlaylist(filePath: string, index: number) {
    const medium = await this.repository.insertMedium(this.index, index, filePath);
    const position = this.media.push(new MediumModel(this.fileExplorer, this.mediaQueueService, medium));
    return this.media[position];
  }

  async updatePlaylistAsync(): Promise<PlaylistModel> {
    let data: UpsertPlaylist = {};
    if (this.original.name !== this.name) {
      data.name = this.name;
    }

    await this.repository.updatePlaylist(this.index, data);
    return this;
  }

  async removeMedium(medium: MediumModel): Promise<void> {
    const index = this.media.indexOf(medium);
    await this.repository.removeMedium(this.index, index);
    this.media.splice(index, 1);
  }
}
