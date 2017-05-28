import {bindable, inject, bindingMode, PLATFORM, DOM, Platform} from 'aurelia-framework';
import {ExplorerService} from '../../services/explorer.service';
import FileExplorerService from '../../services/fileExplorer.service';
import PlaylistExplorerService from '../../services/playlistExplorer.service';
import MediaQueueService from '../../services/mediaQueue.service';
import {FileViewModel} from '../../view-models/file.viewModel';
import {FolderViewModel} from '../../view-models/folder.viewModel';
import {KeyCode, SelectionMode} from '../../constants';

@inject(PLATFORM, DOM.Element, MediaQueueService, FileExplorerService, PlaylistExplorerService)
export class FileExplorerCustomElement {
  @bindable bindToFavorites: boolean;
  @bindable isVisible;
  @bindable exploreWhenVisible: boolean = false; // TODO Read https://github.com/aurelia/templating/issues/96, as it's not a bool but string
  @bindable currentFolder: string;
  @bindable selectedFiles: FileViewModel[];

  private selectionMode: string;
  private lastSelectedFileViewModel: any;
  private defaultMode = SelectionMode.Single;
  private currentMode = this.defaultMode;
  protected explorerService: ExplorerService;

  folderViewModel: FolderViewModel;
  files = [];
  canExecuteFolderUp = false;
  isActive = false;
  hasMediaQueueAny = false;
  private exploringFiles = false;

  constructor(
    private platform: Platform,
    private element: Element,
    private mediaQueueService: MediaQueueService,
    private fileExplorerService: FileExplorerService,
    private playlistExplorerService: PlaylistExplorerService
  ) {
    this.selectionMode = SelectionMode.Single;
    this.lastSelectedFileViewModel = null;
  }

  bind() {
    const explorerBusiness = this.bindToFavorites ?
      this.fileExplorerService :
      this.playlistExplorerService;

    this.setExplorerService(explorerBusiness);

    this.mediaQueueService
      .observeMediaQueue()
      .whereHasValue()
      .map(x => x.length > 0)
      .do(hasMediaQueueAny => this.hasMediaQueueAny = hasMediaQueueAny)
      .subscribe();

    this.explorerService
      .observeCurrentFolderContent()
      .do(folderContent => {
        this.isActive = true;
        this.folderViewModel = new FolderViewModel(folderContent);
        this.currentFolder = folderContent.path;
      })
      .subscribe();

    // TODO Handle a disposeWith method
    // TODO Remember that a failed Observable will end, so find a way to let it alive
  }

  fileSelected(fileViewModel: FileViewModel) {
    const isBrowsable = !fileViewModel.type || fileViewModel.isDirectory;
    if (isBrowsable) {
      this.explorerService.browseFolder(fileViewModel);
    } else {
      this.updateFileSelection(fileViewModel);
    }
  }

  goUp(folderViewModel: FolderViewModel) {
    this.explorerService.goUp(folderViewModel);
  }

  isVisibleChanged(isVisible: boolean) {
    if (!this.exploringFiles && isVisible === true && !!this.exploreWhenVisible === true) {
      this.exploringFiles = true;
      // noinspection JSIgnoredPromiseFromCall
      this.startExplore();
    }
  }

  itemSelected(fileVm: FileViewModel, byDblClick: boolean) {
    const isDir = !fileVm.type || fileVm.isDirectory;
    if (byDblClick) { // item: enqueue | folder: navigate
      if (isDir) {
        this.fileSelected(fileVm);
      } else {
        this.explorerService.playMedium(fileVm);
      }
    } else { // item: select it | folder: navigate
      this.fileSelected(fileVm);
    }
  }

  innerPlayMedium(file) {
    this.explorerService.playMedium(file);
  }

  exploreFileSystem() {
    return this.startExplore();
  }

  private startExplore() {
    return this.explorerService.startExplore();
  }

  setExplorerService(explorerBusiness: ExplorerService) {
    this.explorerService = explorerBusiness;
  }

  updateFileSelection(fileViewModel) {
    switch (this.selectionMode) {
      case SelectionMode.Single:
        this.singleMediaSelection(fileViewModel);
        break;
      case SelectionMode.KeepEach:
        this.multipleMediaSelection(fileViewModel);
        break;
      case SelectionMode.Grouped:
        this.inlineMediaSelection(fileViewModel);
        break;
    }
    this.lastSelectedFileViewModel = fileViewModel;
  }

  singleMediaSelection(fileViewModel) {
    // Un-select all media.
    this.folderViewModel.files.forEach(fileVm => {
      if (fileVm !== fileViewModel) {
        fileVm.selected = false;
      }
    });
    // Toggle selection for selected file.
    fileViewModel.selected = !fileViewModel.selected;
    // Finally update selected files
    this.updateSelectedFiles();
  }

  multipleMediaSelection(fileViewModel) {
    // Toggle selection for selected file.
    fileViewModel.selected = !fileViewModel.selected;
    // Finally update selected files
    this.updateSelectedFiles();
  }

  inlineMediaSelection(fileViewModel) {
    const filesViewModels = this.folderViewModel.files;
    const fileIndex = filesViewModels.indexOf(fileViewModel);
    let startIndex, endIndex;
    // If one file has been selected before, use it as the first to select.
    // So, set startIndex and endIndex to properly select media
    if (this.lastSelectedFileViewModel) {
      // Un-select all media
      filesViewModels.forEach(fileVm => {
        if (fileVm !== fileViewModel) {
          fileVm.selected = false;
        }
      });
      // Select from previous last selected file to selected file
      const lastSelectedFileIndex = filesViewModels.indexOf(this.lastSelectedFileViewModel);
      startIndex = Math.min(lastSelectedFileIndex, fileIndex);
      endIndex = Math.max(lastSelectedFileIndex, fileIndex);
    } else {
      startIndex = 0;
      endIndex = fileIndex;
    }
    // Select files.
    for (let index = startIndex; index <= endIndex; index++) {
      filesViewModels[index].selected = true;
    }
    // Finally update selected files
    this.updateSelectedFiles();
  }

  updateSelectedFiles() {
    const fileSelection = this.folderViewModel.files
      .filter(file => file.selected);
    this.selectedFiles = fileSelection;
    this.explorerService.updateFileSelection(fileSelection);
  }

  attached() {
    this.platform.addEventListener('keydown', this.keydownEventHandler.bind(this));
    this.platform.addEventListener('keyup', this.keyupEventHandler.bind(this));

    this.updateSelectionMode(this.currentMode);
  }

  detached() {
    this.platform.removeEventListener('keydown', this.keydownEventHandler.bind(this));
    this.platform.removeEventListener('keyup', this.keyupEventHandler.bind(this));
  }

  private keydownEventHandler(event: KeyboardEvent) {
    let lastMode = this.currentMode;
    switch (event.keyCode) {
      case KeyCode.Ctrl:
        this.currentMode = SelectionMode.KeepEach;
        break;
      case KeyCode.Shift:
        this.currentMode = SelectionMode.Grouped;
        break;
      default:
        this.currentMode = this.defaultMode;
        break;
    }
    // TODO Should rather listen to an observable for keydown but for all window (here only )
    if (this.currentMode !== lastMode) {
      this.updateSelectionMode(this.currentMode);
    }
  }

  private keyupEventHandler() {
    if (this.currentMode === this.defaultMode) {
      return;
    }
    this.currentMode = this.defaultMode;
    this.updateSelectionMode(this.currentMode);
  }

  updateSelectionMode(mode) {
    this.selectionMode = mode;
  }
}
