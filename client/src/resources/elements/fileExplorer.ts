import {bindable, inject, observable, PLATFORM, Platform} from 'aurelia-framework';
import MediaQueueService from '../../services/mediaQueue.service';
import {FileViewModel} from '../../view-models/file.viewModel';
import {FolderViewModel} from '../../view-models/folder.viewModel';
import {KeyCode, SelectionMode} from '../../constants';
import FolderModel from '../../models/folder.model';
import {FileExplorerService} from '../../services/fileExplorer.service';
import FileModel, {toMedium} from '../../models/file.model';

@inject(PLATFORM, MediaQueueService, FileExplorerService)
export class FileExplorerCustomElement {
  @bindable bindToFavorites: boolean;
  @bindable isVisible;
  @bindable exploreWhenVisible: boolean = false; // TODO Read https://github.com/aurelia/templating/issues/96, as it's not a bool but string
  @observable currentFolder: string;
  @bindable selectedFiles: FileViewModel[];
  @bindable fileFilter: string;
  @bindable isMainExplorer = false;

  private selectionMode = SelectionMode.Single;
  private lastSelectedFileViewModel: FileViewModel = null;
  private defaultMode = SelectionMode.Single;
  private currentMode = this.defaultMode;

  folderViewModel: FolderViewModel;
  files = [];
  canExecuteFolderUp = false;
  isActive = false;
  hasMediaQueueAny = false;
  private exploringFiles = false;

  constructor(
    private platform: Platform,
    private mediaQueueService: MediaQueueService,
    private fileExplorerService: FileExplorerService
  ) {}

  bind() {
    this.mediaQueueService
      .observeMediaQueue()
      .whereHasValue()
      .map(x => x.length > 0)
      .do(hasMediaQueueAny => this.hasMediaQueueAny = hasMediaQueueAny)
      .subscribe();

    if (this.isMainExplorer) {
      this.fileExplorerService
        .observeChangeMainFolderByFavorite()
        .do(folderPath => this.changeFolder(folderPath))
        .subscribe();
    }

    // TODO Handle a disposeWith method
    // TODO Remember that a failed Observable will end, so find a way to let it alive
  }

  async changeFolder(folderPath: string) {
    const folderContent = await this.fileExplorerService.changeFolderByApiUrlAndResetSelection(
      folderPath,
      this.isMainExplorer,
      this.fileFilter);
    this.setFolderContent(folderContent);
  }

  private setFolderContent(folderContent: FolderModel) {
    this.isActive = true;
    this.folderViewModel = new FolderViewModel(folderContent);
    this.currentFolder = folderContent.path;
  }

  async fileSelected(fileViewModel: FileViewModel) {
    const isBrowsable = !fileViewModel.type || fileViewModel.isDirectory;
    if (isBrowsable) {
      const folderContent = await this.fileExplorerService.browseFolder(
        fileViewModel,
        this.isMainExplorer,
        this.fileFilter);
      this.setFolderContent(folderContent);
      this.currentFolder = fileViewModel.filePath;
    } else {
      this.updateFileSelection(fileViewModel);
    }
  }

  async goUp(folderViewModel: FolderViewModel) {
    const folderContent = await this.fileExplorerService.goUp(
      folderViewModel,
      this.isMainExplorer,
      this.fileFilter);
    this.currentFolder = folderViewModel.parentPath;
    this.setFolderContent(folderContent);
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
        this.fileExplorerService.playMedium(toMedium(fileVm));
      }
    } else { // item: select it | folder: navigate
      this.fileSelected(fileVm);
    }
  }

  innerPlayMedium(file) {
    this.fileExplorerService.playMedium(file);
  }

  exploreFileSystem() {
    return this.startExplore();
  }

  private async startExplore() {
    const folderContent = await this.fileExplorerService.startExplore(
      this.isMainExplorer,
      this.fileFilter);
    this.setFolderContent(folderContent);
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
    this.fileExplorerService.updateFileSelection(fileSelection);
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

  private updateSelectionMode(mode) {
    this.selectionMode = mode;
  }
}
