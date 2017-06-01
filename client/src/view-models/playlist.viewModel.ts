import PlaylistModel from '../models/playlist.model';
import MediumViewModel from './medium.viewModel';

export default class PlaylistViewModel extends PlaylistModel {
  isEditing = false;
  media: MediumViewModel[];

  constructor(playlist?: PlaylistModel) {
    super(playlist);
  }
}
