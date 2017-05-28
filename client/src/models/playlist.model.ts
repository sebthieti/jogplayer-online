import {Playlist} from '../entities/playlist';
import {UpsertPlaylist} from '../repositories/playlist.repository';
import MediumModel from './medium.model';

interface PlaylistModelSnapshot {
  name?: string;
  filePath?: string;
}

export default class PlaylistModel {
  name: string;
  filePath: string;
  isAvailable: boolean;
  media: MediumModel[];

  private original: PlaylistModelSnapshot;

  constructor(playlist?: Playlist) {
    this.original = playlist || {} as PlaylistModelSnapshot;
    this.setFromEntity(playlist);
  }

  setFromEntity(playlist?: Playlist): PlaylistModel {
    Object.assign(this, playlist);
    this.takeSnapshot();
    return this;
  }

  private takeSnapshot(): void {
    this.original = {
      name: this.name,
      filePath: this.filePath
    };
  }

  findMediumIndex(medium: MediumModel): number {
    return this.media && this.media.indexOf(medium);
  }

  hasMedium(medium: MediumModel): boolean {
    return this.media && this.media.indexOf(medium) !== -1;
  }

  toUpdateRequest(): UpsertPlaylist {
    let data: UpsertPlaylist = {};
    if (this.original.name !== this.name) {
      data.name = this.name;
    }
    if (this.original.filePath !== this.filePath) {
      data.filePath = this.filePath;
    }
    return data;
  }
}
