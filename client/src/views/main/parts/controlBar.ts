import {autoinject} from 'aurelia-framework';
import MediaService from '../../../services/media.service';
import {FileExplorerService} from '../../../services/fileExplorer.service';
import PlaylistService from '../../../services/playlist.service';
import FavoriteService from '../../../services/favorite.service';
import MediaQueueService from '../../../services/mediaQueue.service';
import {toMedium} from '../../../models/file.model';
import FavoriteModel from "../../../models/favorite.model";
import MediumModel from '../../../models/medium.model';

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
      .observeMainExplorerContent()
      .do(isBrowsing => this.canAddFolderToFavorites = !!isBrowsing)
      .subscribe();
  }

  addFolderToFavoritesCmd(): Promise<FavoriteModel> {
    const folderContent = this.fileExplorerService.getMainFolderContent();
    return this.favoriteService.addFolderToFavoritesAsync(folderContent.path);
  }

  addFilesToPlaylist(): Promise<MediumModel[]> {
    const fileModels = this.fileExplorerService.getFileSelection();
    return this.playlistService.addFilesToSelectedPlaylist(
      fileModels.map(file => file.filePath)
    );
  }

  enqueueMediaSelection(): void {
    const mediaModels = this.mediaService.getMediaSelection();
    this.mediaQueueService.enqueueMediaAndStartQueue(mediaModels);
  }

  enqueueFileSelection(): void {
    const fileModels = this.fileExplorerService.getFileSelection();
    this.mediaQueueService.enqueueMediaAndStartQueue(
      fileModels.map(file => toMedium(file))
    );
  };
}
