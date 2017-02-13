'use strict';

jpoApp.factory('playlistExplorerBusiness', ['explorerBusinessFactory', function(explorerBusinessFactory) {
	return explorerBusinessFactory.buildPlaylistExplorerBusiness();
}]).factory('fileExplorerBusiness', ['explorerBusinessFactory', function(explorerBusinessFactory) {
	return explorerBusinessFactory.buildFileExplorerBusiness();
}]).factory('explorerBusinessFactory', [
	'favoriteBusiness',
	'mediaQueueBusiness',
	'fileExplorerService',
	'folderContentBuilder',
	'FileExplorerModel',
	'$filter',
	function(favoriteBusiness, mediaQueueBusiness, fileExplorerService, folderContentBuilder, FileExplorerModel, $filter) {
		function ExplorerBusiness(doLinkToFavorites, fileFilter) {
			var folderContentSubject = new Rx.BehaviorSubject();
			var selectedFilesSubject = new Rx.BehaviorSubject();

			if (doLinkToFavorites) {
				favoriteBusiness
					.observeSelectedFavorite()
					.select(function (favoriteModel) {
						return favoriteModel.selectTargetLinkUrlFromLinks();
					})
					.do(function(favoriteLinkUrl) {
						changeFolderByApiUrlAndResetSelection(favoriteLinkUrl);
					})
					.silentSubscribe();
			}

			var observeCurrentFolderContent = function() {
				return folderContentSubject.where(function(folderContent) {
					return angular.isDefined(folderContent);
				});
			};

			var browseFolder = function(folderToBrowseModel) {
				var dirPath = folderToBrowseModel.selectSelfFromLinks();
				changeFolderByApiUrlAndResetSelection(dirPath);
			};

			var goUp = function(folderToBrowseUpModel) {
				var parentDirPath = folderToBrowseUpModel.selectParentDirFromLinks();
				changeFolderByApiUrlAndResetSelection(parentDirPath);
			};

			// Called by outside breadcrumb
			var changeFolderByApiUrlAndResetSelection = function(folderApiLink) {
				loadFolderContentAsync(folderApiLink)
					.then(function(folderContentVm) {
						folderContentSubject.onNext(folderContentVm);
						selectedFilesSubject.onNext(null);
					});
			};

			var loadFolderContentAsync = function(linkUrl) {
				return FileExplorerModel
					.getFolderByLink(linkUrl)
					.then(filterAndOrderFiles);
					//.then(function (folderContent) {
					//	return viewModelBuilder.buildEditableViewModel(folderContent);
					//})
			};

			var startExplore = function() {
				FileExplorerModel
					.getAllAsync()
					.then(filterAndOrderFiles)
					.then(function(filesResult) {
						folderContentSubject.onNext(filesResult);
						//viewModelBuilder.buildEditableViewModel(filesResult)
					})
				;
			};

			var filterAndOrderFiles = function(folderContent) {
				var folderContentCpy = folderContent.clone();
				folderContentCpy.files = filterFiles(folderContentCpy.files);
				folderContentCpy.files = $filter('orderBy')(folderContentCpy.files, ['type','name']);
				return folderContentCpy;
			};

			var updateFileSelection = function(files) {
				selectedFilesSubject.onNext(files);
			};

			var getAndObserveHasFileSelection = function() {
				return observeFileSelection()
					.select(function(fileSelection) {
						return _.any(fileSelection);
					})
					.startWith(false);
			};

			var observeFileSelection = function() {
				// TODO Really check that here, not from UI (ensure Folder mustn't be selectable) ?
				return selectedFilesSubject
					.whereIsDefined()
					.where(function(fileViewModelsSelection) { // distinct until change
						// Where all elements in selection are files, no dir.
						return _.all(fileViewModelsSelection, function(fileViewModel) {
							return fileViewModel.model.isFile();
						});
					}); // TODO Use publish to avoid traverse entire Rx ?
			};

			// TODO Should be in fileExplorerBusiness, not ExplorerBusiness
			var playMedium = function(medium) {
				mediaQueueBusiness.enqueueMedium(medium.model);
			};

			// TODO Think about: filter s/b business side or controller ? Shoulnd't be, because only where filter on endpoint
			var filterFiles = function (files) {
				return _.filter(files, function(file) {
					return !file.type || file.type === 'D' || !fileFilter || file.name.endsWith(fileFilter);
				});
			};

			return {
				observeCurrentFolderContent: observeCurrentFolderContent,
				observeFileSelection: observeFileSelection,
				getAndObserveHasFileSelection: getAndObserveHasFileSelection,
				browseFolder: browseFolder,
				goUp: goUp,
				startExplore: startExplore,
				changeFolderByApiLinkAndResetSelection: changeFolderByApiUrlAndResetSelection,
				updateFileSelection: updateFileSelection,
				playMedium: playMedium // TODO Or requestPlayMedium ?
			}
		}

		return {
			buildFileExplorerBusiness: function() {
				return new ExplorerBusiness(true);
			},

			buildPlaylistExplorerBusiness: function() { // TODO Rather filter in server with where clause in fileExp endpoint
				return new ExplorerBusiness(false, 'm3u');
			}
		};
}]);