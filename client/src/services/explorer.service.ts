import { BehaviorSubject } from 'rx';
import FavoriteService from './favorite.service';
import UserModel from '../models/user.model';
import MediaQueueService from './mediaQueue.service';

export abstract class ExplorerService {
  folderContentSubject = new BehaviorSubject();
  selectedFilesSubject = new BehaviorSubject();
  private fileFilter: string;
  private doLinkToFavorites: boolean;

  constructor(
    private favoriteService: FavoriteService,
    // private fileExplorerService: FileExplorerService,
    private mediaQueueService: MediaQueueService//,
    // doLinkToFavorites: boolean,
    // private fileFilter: string
  ) {
    // this.init(doLinkToFavorites);
  }

  protected init(doLinkToFavorites: boolean, fileFilter?: string) {
    this.fileFilter = fileFilter;
    this.doLinkToFavorites = doLinkToFavorites;
    // if (doLinkToFavorites) {
    //   this.favoriteService
    //     .observeSelectedFavorite()
    //     .select(function (favoriteModel) {
    //       return favoriteModel.selectTargetLinkUrlFromLinks();
    //     })
    //     .do(function(favoriteLinkUrl) {
    //       this.changeFolderByApiUrlAndResetSelection(favoriteLinkUrl);
    //     })
    //     .silentSubscribe();
    // }
  }

  observeCurrentFolderContent() {
    return this.folderContentSubject.filter(folderContent => folderContent);
  }

  browseFolder(folderToBrowseModel) {
    const dirPath = folderToBrowseModel.selectSelfFromLinks();
    this.changeFolderByApiUrlAndResetSelection(dirPath);
  }

  goUp(folderToBrowseUpModel) {
    const parentDirPath = folderToBrowseUpModel.selectParentDirFromLinks();
    this.changeFolderByApiUrlAndResetSelection(parentDirPath);
  }

  // Called by outside breadcrumb
  changeFolderByApiUrlAndResetSelection(folderApiLink) {
    this.loadFolderContentAsync(folderApiLink)
      .then(function(folderContentVm) {
        this.folderContentSubject.onNext(folderContentVm);
        this.selectedFilesSubject.onNext(null);
      });
  };

  private async loadFolderContentAsync(linkUrl) {
    const folder = await this.getFolder(linkUrl);
    this.filterAndOrderFiles(folder);
    //.then(function (folderContent) {
    //	return viewModelBuilder.buildEditableViewModel(folderContent);
    //})
  };

  async startExplore(user: UserModel) {
    // authBusiness.observeAuthenticatedUser().getValueAsync(function(user) {
    //   var homePath = user.selectBrowsingHomePathFromLinks() || '';
    const homePath = user.permissions.homePath;
    if (homePath) {
      const filesResult = await this.loadFolderContentAsync(homePath);
      this.folderContentSubject.onNext(filesResult);
    } else {
      let files = await this.getFolder('/');
      files = this.filterAndOrderFiles(files);
      this.folderContentSubject.onNext(files);
      // FileExplorerModel
      //   .getAsync()
      //   .then(this.filterAndOrderFiles)
      //   .then(function(filesResult) {
      //     this.folderContentSubject.onNext(filesResult);
      //     //viewModelBuilder.buildEditableViewModel(filesResult)
      //   });
    }
    // });
  }

  getFolder(url: string) {
    // var self = this;
    //
    // return this.service
    //   .getByLinkAsync(url)
    //   .then(function(folderContent) {
    //     //self.validateArray(folderContent, self.schema); // TODO Work on this
    //     return Model.build(self.endpointName, self.schema, folderContent);
    //   });
  }

  // get hasParentDir(): boolean {
  //   return false;
  // }

  private filterAndOrderFiles(folderContent) {
    const folderContentCpy = folderContent.clone();
    folderContentCpy.files = this.filterFiles(folderContentCpy.files);
    // folderContentCpy.files = $filter('orderBy')(folderContentCpy.files, ['type','name']);
    return folderContentCpy;
  };

  updateFileSelection(files) {
    this.selectedFilesSubject.onNext(files);
  };

  getAndObserveHasFileSelection() {
    return this.observeFileSelection()
      .map(fileSelection => fileSelection.some())
      .startWith(false);
  };

  observeFileSelection() {
    // TODO Really check that here, not from UI (ensure Folder mustn't be selectable) ?
    return this.selectedFilesSubject
      .filter(x => x)
      .filter(fileViewModelsSelection => { // distinct until change
        // Where all elements in selection are files, no dir.
        return fileViewModelsSelection.every(fileViewModel => fileViewModel.model.isFile());
      }); // TODO Use publish to avoid traverse entire Rx ?
  };

  // TODO Should be in fileExplorerBusiness, not ExplorerBusiness
  playMedium(medium) {
    this.mediaQueueService.enqueueMediumAndStartQueue(medium.model);
  };

  // TODO Think about: filter s/b business side or controller ? Shoulnd't be, because only where filter on endpoint
  private filterFiles(files) {
    return files.filter(file =>
      !file.type || file.type === 'D' || !this.fileFilter || file.name.endsWith(this.fileFilter)
    );
  };
}
