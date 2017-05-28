import PlaylistModel from './playlist.model';
import {Playlist} from '../entities/playlist';
import PlaylistRepository, {UpsertPlaylist} from '../repositories/playlist.repository';
import {FileExplorerRepository} from '../repositories/fileExplorer.repository';
import MediaQueueService from '../services/mediaQueue.service';

export default class PlaylistCollection {
  private playlists: PlaylistModel[];

  constructor(
    private repository: PlaylistRepository,
    private fileExplorer: FileExplorerRepository,
    private mediaQueueService: MediaQueueService,
    playlists: Playlist[]
  ) {}

  async addByFilePathAsync(filePath: string): Promise<PlaylistModel> {
    const playlist = await this.repository.insertPlaylist({
      filePath
    } as UpsertPlaylist);
    const position = this.playlists.push(new PlaylistModel(playlist));
    return this.playlists[position];
  }
}
