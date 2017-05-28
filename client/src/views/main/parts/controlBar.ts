import {autoinject} from 'aurelia-framework';
import MediaService from '../../../services/media.service';
import FileExplorerService from '../../../services/fileExplorer.service';
import PlaylistService from '../../../services/playlist.service';
import FavoriteService from '../../../services/favorite.service';
import MediaQueueService from '../../../services/mediaQueue.service';
import {FileViewModel} from '../../../view-models/file.viewModel';

@autoinject
export class ControlBarViewPort {
  canAddFilesToPlaylist = false;
  canAddFolderToFavorites = false;
  canEnqueueMediaSelection = false;
  canEnqueueFileSelection = false;

  constructor(
    private mediaService: MediaService,
    private fileExplorerService: FileExplorerService,
    private playlistService: PlaylistService,
    private favoriteService: FavoriteService,
    private mediaQueueService: MediaQueueService
  ) { }

  bind() {
    this.mediaService
      .getAndObserveHasMediaSelection()
      .do(hasSelection => this.canEnqueueMediaSelection = hasSelection)
      .subscribe();

    this.fileExplorerService
      .getAndObserveHasFileSelection()
      .combineLatest(
        this.playlistService.observeCurrentPlaylist(),
        (hasFileSelection, currentPlaylist) =>
          this.canAddFilesToPlaylist = hasFileSelection && currentPlaylist !== undefined
      )
      .subscribe();

    this.fileExplorerService
      .getAndObserveHasFileSelection()
      .do(hasFileSelection => this.canEnqueueFileSelection = hasFileSelection)
      .subscribe();

    this.fileExplorerService
      .observeCurrentFolderContent()
      .do(isBrowsing => this.canAddFolderToFavorites = isBrowsing)
      .subscribe();
  }

  addFolderToFavoritesCmd() {
    const folderContent = this.fileExplorerService.getCurrentFolderContent();
    const folderPath = folderContent.path;
    this.favoriteService.addFolderToFavoritesAsync(folderPath);
  }

  addFilesToPlaylist() {
    this.fileExplorerService
      .observeFileSelection()
      .asAsyncValue()
      .filter(fileSelection => fileSelection.length > 0)
      .map((files: FileViewModel[]) => {
        return files.map(file => file.filePath);
      })
      .do(fileSelection => this.playlistService.addFilesToSelectedPlaylist(fileSelection))
      .subscribe();
  }

  enqueueMediaSelection() {
    this.mediaService
      .observeMediaSelection()
      .select(mediaViewModelsSelection => mediaViewModelsSelection.map(m => m))
      .getValueAsync(mediaModelsSelection =>
        this.mediaQueueService.enqueueMediaAndStartQueue(mediaModelsSelection)
      );
  }

  enqueueFileSelection() {
    this.fileExplorerService
      .observeFileSelection()
      .select(fileViewModel => fileViewModel.map(f => f.model))
      .getValueAsync(fileModels =>
        this.mediaQueueService.enqueueMediaAndStartQueue(fileModels)
      );
  };
}
