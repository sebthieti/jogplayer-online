import {autoinject} from 'aurelia-framework';
import { BehaviorSubject, Observable, Subject } from 'rx';
import MediaQueueService from './mediaQueue.service';
import AuthenticationService from './authentication.service';
import {FileExplorerRepository} from '../repositories/fileExplorer.repository';
import FolderModel from '../models/folder.model';
import FileModel from '../models/file.model';
import MediumModel from '../models/medium.model';

@autoinject
export class FileExplorerService {
  folderContentSubject = new BehaviorSubject<FolderModel>(null);
  selectedFilesSubject = new BehaviorSubject<FileModel[]>(null);
  changeMainFolderByFavoriteSubject = new Subject<string>();

  constructor(
    private authenticationService: AuthenticationService,
    private mediaQueueService: MediaQueueService,
    private fileExplorerRepository: FileExplorerRepository
  ) {}

  observeMainExplorerContent(): Observable<FolderModel> {
    return this.folderContentSubject.filter(folderContent => !!folderContent);
  }

  getMainFolderContent(): FolderModel {
    return this.folderContentSubject.getValue();
  }

  observeChangeMainFolderByFavorite(): Observable<string> {
    return this.changeMainFolderByFavoriteSubject;
  }

  browseFolder(
    folderToBrowseModel: FileModel,
    isMainExplorer: boolean,
    fileFilter?: string
  ): Promise<FolderModel> {
    return this.changeFolderByApiUrlAndResetSelection(
      folderToBrowseModel.filePath,
      isMainExplorer,
      fileFilter);
  }

  goUp(
    folderToBrowseUpModel: FolderModel,
    isMainExplorer: boolean,
    fileFilter?: string
  ): Promise<FolderModel> {
    const parentDirPath = folderToBrowseUpModel.parentPath;
    return this.changeFolderByApiUrlAndResetSelection(
      parentDirPath,
      isMainExplorer,
      fileFilter);
  }

  // TODO May be removed Called by outside breadcrumb
  async changeFolderByApiUrlAndResetSelection(
    folderPath: string,
    isMainExplorer: boolean,
    fileFilter?: string
  ): Promise<FolderModel> {
    const folderContentVm = await this.getFolder(folderPath, fileFilter);
    if (isMainExplorer) {
      this.folderContentSubject.onNext(folderContentVm);
      this.selectedFilesSubject.onNext(null);
    }
    return folderContentVm;
  }

  async changeMainFolderByFavorite(folderPath: string) {
    this.changeMainFolderByFavoriteSubject.onNext(folderPath);
  }

  async startExplore(isMainExplorer: boolean, fileFilter?: string) {
    const user = this.authenticationService.getActiveUser();
    const homePath = user.permissions.homePath;

    const files = await this.getFolder(homePath || '/', fileFilter);

    if (isMainExplorer) {
      this.folderContentSubject.onNext(files);
    }

    return files;
  }

  private async getFolder(url: string, fileFilter?: string): Promise<FolderModel> {
    const folder = await this.fileExplorerRepository.getFolder(url);
    return new FolderModel(url, folder, fileFilter);
  }

  updateFileSelection(files: FileModel[]) {
    this.selectedFilesSubject.onNext(files);
  }

  // TODO Should be in fileExplorerBusiness, not ExplorerBusiness
  playMedium(medium: MediumModel) {
    this.mediaQueueService.enqueueMediumAndStartQueue(medium);
  }

  getAndObserveHasFileSelection(): Observable<boolean> {
    return this.observeFileSelection()
      .map(fileSelection => fileSelection.length > 0)
      .startWith(false);
  }

  observeFileSelection(): Observable<FileModel[]> {
    // TODO Really check that here, not from UI (ensure Folder mustn't be selectable) ?
    return this.selectedFilesSubject
      .filter(x => !!x)
      .filter(fileViewModelsSelection => { // distinct until change
        // Where all elements in selection are files, no dir.
        return fileViewModelsSelection.every(fileViewModel => fileViewModel.isFile);
      }); // TODO Use publish to avoid traverse entire Rx ?
  }

  getFileSelection(): FileModel[] {
    return this.selectedFilesSubject.getValue();
  }
}
