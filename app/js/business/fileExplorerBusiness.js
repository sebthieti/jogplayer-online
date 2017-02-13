'use strict';

jpoApp.factory('fileExplorerBusiness', function(favoriteBusiness, fileExplorerService) {

	var linkHelper = Helpers.linkHelpers;

	var folderContentSubject = new Rx.Subject();

	var observeFavoriteSelection = function() {
		return favoriteBusiness
			.observeSelectedFavorite()
			.selectMany(function (favorite) {
				var target = linkHelper.selectTargetLinkFromLinks(favorite.links);
			    return Rx.Observable.fromPromise(loadFolderContentAsync(target.href));
			});
	};

	var observeCurrentFolderContent = function(observeExternalChanges, issuerGroup, caller) { // TODO Combine it with the above one
		var baseObs = folderContentSubject
			.where(function(folderContentSet) {
				if (folderContentSet.caller) {
					return folderContentSet.caller === caller;
				} else if (folderContentSet.issuerGroup) {
					return folderContentSet.issuerGroup === issuerGroup;
				}
			});
		if (observeExternalChanges) {
			baseObs = baseObs.merge(observeFavoriteSelection());
		}
		return baseObs
			.select(function(folderContentSet) {
				if (folderContentSet.folderContentVm) {
					return folderContentSet.folderContentVm;
				}
				return folderContentSet;
			});
	};

	var changeFolderByApiLink = function(folderApiLink) {
		loadFolderContentAsync(folderApiLink)
			.then(function(folderContentVm) {
				folderContentSubject.onNext({
					issuerGroup: 'mediaExplorer',
					folderContentVm: folderContentVm
				});
			});
	};

	var goUp = function(links, issuerGroup) {
		var parentDirPath = linkHelper.selectParentDirFromLinks(links);
		loadFolderContentAsync(parentDirPath)
			.then(function(folderContentVm) {
				folderContentSubject.onNext({
					issuerGroup: issuerGroup,
					folderContentVm: folderContentVm
				});
			});
	};

	var startExplore = function(caller) {
		fileExplorerService
			.startExplore()
			.then(function(filesResult) {
				var folderContentVm = buildFolderContentStruct(filesResult);
				folderContentSubject.onNext({
					caller: caller,
					folderContentVm: folderContentVm
				});
			});
	};

	var fileSelected = function(file, issuerGroup) {
		var isBrowsable = !file.type || file.type === 'D';
		if (isBrowsable) {
			var dirPath = linkHelper.selectSelfFromLinks(file.links);
			loadFolderContentAsync(dirPath)
				.then(function(folderContentVm) {
					folderContentSubject.onNext({
						issuerGroup: issuerGroup,
						folderContentVm: folderContentVm
					});
				});

			// Reload folder mean we'll lose last file
			// TODO The following statement wasn't commented, and was part of the then call.
			//_lastSelectedFile = null;
		} else {
			// TODO The following statement wasn't commented
			//updateFileSelection(file);
		}
	};

	var loadFolderContentAsync = function(linkUrl) {
		return fileExplorerService
			.getResourceAsync(linkUrl)
			.then(function (folderContent) {
				return buildFolderContentStruct(folderContent);
			}, function (err) {
			});
	};

	var buildFolderContentStruct = function(folderContent) {
		var files = folderContent.files;
		var links = folderContent.links;
		// TODO To Builder To VM -> To entity/data
		_.each(files, function(file) {
			buildViewModel(file);
		});

		var parentDirPath = linkHelper.selectParentDirFromLinks(links);

		return { // TODO Assimilate to a viewModel
			files: files,
			links: links,
			isActive: true,
			canExecuteFolderUp: angular.isDefined(parentDirPath)
		};
	};

	// TODO Think about: filter s/b business side or controller ?
	var filterFiles = function (files, filterFiles) {
		return _.filter(files, function(file) {
			return !file.type || file.type === 'D' || file.name.endsWith(filterFiles); // TODO Should handle multi ext.
		});
	};

	var buildViewModel = function (file) {
		file.selected = false;
		file.hasError = false;
	};

	return {
		observeCurrentFolderContent: observeCurrentFolderContent,
		fileSelected: fileSelected,
		goUp: goUp,
		startExplore: startExplore,
		changeFolderByApiLink: changeFolderByApiLink
	}
});