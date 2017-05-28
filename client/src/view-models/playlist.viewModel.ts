import PlaylistModel from '../models/playlist.model';

export default class PlaylistViewModel extends PlaylistModel {
  isEditing = false;

  constructor(playlist?: PlaylistModel) {
    super(playlist);
  }
}
