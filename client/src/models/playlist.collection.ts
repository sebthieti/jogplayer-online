import PlaylistModel from './playlist.model';
import UserModel from './user.model';
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
    // private user: UserModel,
    playlists: Playlist[]
  ) {
    // this.playlists = playlists && playlists.map(playlist => new PlaylistModel(
    //     repository,
    //     playlist
    //   )) || [];
  }

  // updatePlaylistAsync(playlistModel){
  //   return playlistModel.updateAsync();
  //   //playlistChangeSubject.onNext({
  //   //	entity: updatedPlaylist.toArray(),
  //   //	status: EntityStatus.Updated
  //   //});
  // }


  async addByFilePathAsync(filePath: string): Promise<PlaylistModel> {
    const playlist = await this.repository.insertPlaylist({
      filePath
    } as UpsertPlaylist);
    const position = this.playlists.push(new PlaylistModel(
      this.repository,
      this.fileExplorer,
      this.mediaQueueService,
      playlist
    ));
    return this.playlists[position];
    // return this.addAsync({
    //   filePath: playlistModel.selectSelfPhysicalFromLinks()
    // });
  }

}
