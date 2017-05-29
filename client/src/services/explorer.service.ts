import { BehaviorSubject, Observable } from 'rx';
import FavoriteService from './favorite.service';
import UserModel from '../models/user.model';
import MediaQueueService from './mediaQueue.service';
import AuthenticationService from './authentication.service';
import {FileExplorerRepository} from '../repositories/fileExplorer.repository';
import FolderModel from '../models/folder.model';
import FileModel from '../models/file.model';

export class ExplorerService {
  folderContentSubject = new BehaviorSubject<FolderModel>(null);
  selectedFilesSubject = new BehaviorSubject<FileModel[]>(null);

  constructor(
    private authenticationService: AuthenticationService,
    private mediaQueueService: MediaQueueService,
    private fileExplorerRepository: FileExplorerRepository,
    private fileFilter?: string
  ) {}

  observeCurrentFolderContent(): Observable<FolderModel> {
    return this.folderContentSubject.filter(folderContent => !!folderContent);
  }

  getCurrentFolderContent(): FolderModel {
    return this.folderContentSubject.getValue();
  }

  browseFolder(folderToBrowseModel: FileModel): Promise<void> {
    return this.changeFolderByApiUrlAndResetSelection(folderToBrowseModel.filePath);
  }

  goUp(folderToBrowseUpModel: FolderModel): Promise<void> {
    const parentDirPath = folderToBrowseUpModel.parentPath;
    return this.changeFolderByApiUrlAndResetSelection(parentDirPath);
  }

  // Called by outside breadcrumb
  async changeFolderByApiUrlAndResetSelection(folderApiLink): Promise<void> {
    const folderContentVm = await this.loadFolderContentAsync(folderApiLink);
    this.folderContentSubject.onNext(folderContentVm);
    this.selectedFilesSubject.onNext(null);
  }

  async startExplore() {
    const user = this.authenticationService.getActiveUser();
    const homePath = user.permissions.homePath;
    if (homePath) {
      const filesResult = await this.loadFolderContentAsync(homePath);
      this.folderContentSubject.onNext(filesResult);
    } else {
      let files = await this.getFolder('/');
      this.folderContentSubject.onNext(files);
    }
  }

  private loadFolderContentAsync(linkUrl: string): Promise<FolderModel> {
    return this.getFolder(linkUrl);
  }

  private async getFolder(url: string): Promise<FolderModel> {
    const folder = await this.fileExplorerRepository.getFolder(url);
    return new FolderModel(url, folder, this.fileFilter);
  }

  updateFileSelection(files: FileModel[]) {
    this.selectedFilesSubject.onNext(files);
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

  // TODO Should be in fileExplorerBusiness, not ExplorerBusiness
  playMedium(medium) {
    this.mediaQueueService.enqueueMediumAndStartQueue(medium);
  }
}
