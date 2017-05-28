import {autoinject, observable, bindable} from 'aurelia-framework';
import PlaylistService from '../../../services/playlist.service';
import MediaService from '../../../services/media.service';
import MediaQueueService from '../../../services/mediaQueue.service';
import PlaylistModel from '../../../models/playlist.model';
import PlaylistViewModel from '../../../view-models/playlist.viewModel';
import MediumModel from '../../../models/medium.model';
import {FileViewModel} from '../../../view-models/file.viewModel';

@autoinject
export class PlaylistExplorerViewPort {
  private currentIndexEdited = -1;

  @observable isPlaylistFinderVisible = false;
  @bindable selectedPlaylistFiles: FileViewModel[] = [];
  playlistsVm: PlaylistViewModel[];
  selectedMedia = null;
  newPlaylist = null;
  isAdding = false;
  canShowMediaInPlaylist = true;
  canValidateSelection = true;
  canShowPlaylistFinderValidate;
  hasMediaQueueAny = false;
  selectedPlaylist;
  selectedPlaylistIndex: number;

  constructor(
    private playlistService: PlaylistService,
    private mediaService: MediaService,
    private mediaQueueService: MediaQueueService
  ) {}

  async bind() {
    this.playlistService
      .observeCurrentPlaylist()
      .do(playlistVm => this.selectedPlaylist = playlistVm)
      .subscribe();

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

    this.playlistsVm = await this.playlistService.loadPlaylists();
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

  mediaSelected(media) {
    media.selected = !media.selected;

    this.selectedMedia = this.selectedPlaylist.media
      .filter(media => media.selected);

    this.mediaService.changeMediaSelection(this.selectedMedia);
  }

  // BEGIN Playlist section

  async innerRemovePlaylist(playlistIndex: number, playlistVm) {
    await this.playlistService.removePlaylistAsync(playlistVm);
    this.playlistsVm.splice(playlistIndex, 1);


    this.selectedPlaylist = null;
  }

  beginEditPlaylist(playlistVm) {
    if (this.currentIndexEdited != -1) {
      this.playlistsVm[this.currentIndexEdited].isEditing = false;
    }
    this.currentIndexEdited = this.playlistsVm.indexOf(playlistVm);
    playlistVm.isEditing = true;
  }

  async endEditPlaylist(playlistIndex: number, playlistVm: PlaylistViewModel) {
    const updatedPlaylist = await this.playlistService.updatePlaylistAsync(playlistIndex, playlistVm);

    playlistVm.isEditing = false;

    this.playlistsVm[this.currentIndexEdited] = playlistVm;
    this.currentIndexEdited = -1;
  }

  innerPlaylistSelected(playlistIndex: number, playlistVm) {
    this.selectedPlaylistIndex = playlistIndex;

    this.playlistService.playlistSelected(playlistIndex, playlistVm); // TODO Rename to fireAndForget
  }

  beginAddVirtualPlaylist() {
    this.newPlaylist = new PlaylistModel();
    this.isAdding = true;
  }

  async endAddVirtualPlaylist() {
    await this.playlistService.addVirtualPlaylistAsync(this.newPlaylist);
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

