import {autoinject, observable, bindable} from 'aurelia-framework';
import PlaylistService from '../../../services/playlist.service';
import MediaService from '../../../services/media.service';
import MediaQueueService from '../../../services/mediaQueue.service';
import PlaylistModel from '../../../models/playlist.model';
import PlaylistViewModel from '../../../view-models/playlist.viewModel';
import MediumModel from '../../../models/medium.model';
import {FileViewModel} from '../../../view-models/file.viewModel';
import MediumViewModel from '../../../view-models/medium.viewModel';

@autoinject
export class PlaylistExplorerViewPort {
  private currentIndexEdited = -1;

  @observable isPlaylistFinderVisible = false;
  @bindable selectedPlaylistFiles: FileViewModel[] = [];
  playlistsVm: PlaylistViewModel[];
  selectedMedia: MediumModel[];
  newPlaylist: PlaylistModel;
  isAdding = false;
  canShowMediaInPlaylist = true;
  canValidateSelection = true;
  canShowPlaylistFinderValidate: boolean;
  hasMediaQueueAny = false;
  selectedPlaylistIndex: number;

  constructor(
    private playlistService: PlaylistService,
    private mediaService: MediaService,
    private mediaQueueService: MediaQueueService
  ) {}

  async bind() {
    // BEGIN Bootstrap section

    this.playlistService
      .observePlayingMedium()
      .mapWithPreviousValue((oldPlayingMedium: MediumModel, newPlayingMedium: MediumModel) => {
        if (oldPlayingMedium) {
          oldPlayingMedium.isPlaying = false;
        }
        if (newPlayingMedium) {
          newPlayingMedium.isPlaying = true;
        }
      })
      .subscribe();

    // END Bootstrap section

    this.mediaQueueService
      .observeMediaQueue()
      .whereHasValue()
      .map(x => x.length > 0)
      .do(hasMediaQueueAny => this.hasMediaQueueAny = hasMediaQueueAny)
      .subscribe();

    const playlists = await this.playlistService.loadPlaylists();
    this.playlistsVm = playlists.map(p => new PlaylistViewModel(p));
  }

  // BEGIN Add physical playlist

  beginAddPhysicalPlaylist() {
    // Toggle explorer visibility
    this.isPlaylistFinderVisible = true;
  }

  endAddPhysicalPlaylist() {
    this.isPlaylistFinderVisible = false;
    return this.playlistService.addPhysicalPlaylistsByFilePathsAsync(
      this.selectedPlaylistFiles.map(x => x.filePath)
    );
  }

  cancelImport() {
    this.isPlaylistFinderVisible = false;
  }

  // END Add physical playlist

  cancelAddPlaylist(playlistVm) {
    if (playlistVm) {
      playlistVm.isEditing = false;
    } else {
      this.isAdding = false;
    }
    this.currentIndexEdited = -1;
  }

  selectedPlaylistFilesChanged(newSelection: FileViewModel[]) {
    this.canValidateSelection = newSelection.length > 0;
  }

  // Link PlaylistFinder Validator with PlaylistFinder on visibility
  isPlaylistFinderVisibleChanged(isVisible: boolean) {
    this.canShowMediaInPlaylist = !isVisible;
    this.canShowPlaylistFinderValidate = isVisible;
  }

  mediaSelected(medium: MediumViewModel) {
    medium.selected = !medium.selected;

    this.selectedMedia = this.playlistsVm[this.selectedPlaylistIndex].media
      .filter(media => media.selected);

    this.mediaService.changeMediaSelection(this.selectedMedia);
  }

  // BEGIN Playlist section

  async innerRemovePlaylist(playlistIndex: number) {
    await this.playlistService.removePlaylistAsync(playlistIndex);
    this.playlistsVm.splice(playlistIndex, 1);

    this.selectedPlaylistIndex = null;
  }

  beginEditPlaylist(playlistVm) {
    if (this.currentIndexEdited != -1) {
      this.playlistsVm[this.currentIndexEdited].isEditing = false;
    }
    this.currentIndexEdited = this.playlistsVm.indexOf(playlistVm);
    playlistVm.isEditing = true;
  }

  async endEditPlaylist(playlistIndex: number, playlistVm: PlaylistViewModel) {
    await this.playlistService.updatePlaylistAsync(playlistIndex, playlistVm);

    playlistVm.isEditing = false;

    this.playlistsVm[this.currentIndexEdited] = playlistVm;
    this.currentIndexEdited = -1;
  }

  async innerPlaylistSelected(playlistIndex: number, playlistVm: PlaylistViewModel) {
    this.selectedPlaylistIndex = playlistIndex;

    if (!playlistVm.media) {
      const media = await this.playlistService.loadMediaAsync(playlistIndex);
      playlistVm.media = media.map(m => new MediumViewModel(m));
    }
    this.playlistService.playlistSelected(playlistIndex);
  }

  beginAddVirtualPlaylist() {
    this.newPlaylist = new PlaylistModel();
    this.isAdding = true;
  }

  async endAddVirtualPlaylist() {
    const playlist = await this.playlistService.addVirtualPlaylistAsync(this.newPlaylist);
    this.playlistsVm.push(new PlaylistViewModel(playlist));

    this.newPlaylist = null;
    this.isAdding = false;
  }

  // END Playlist section

  // BEGIN Media section

  async innerRemoveMedium(mediumIndex: number) {
    await this.playlistService.removeMediumFromPlaylist(this.selectedPlaylistIndex, mediumIndex);
    this.playlistsVm[this.selectedPlaylistIndex].media.splice(mediumIndex, 1);
  }

  innerPlayMedium(mediumIndex: number) {
    this.playlistService.playMedium(this.selectedPlaylistIndex, mediumIndex);
  }

  // END Media section
}
