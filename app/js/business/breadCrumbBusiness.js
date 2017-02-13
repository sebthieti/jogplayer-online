'use strict';

jpoApp.factory('breadCrumbBusiness', function(fileExplorerBusiness) {
	var observeCurrentDir = function () {
		return fileExplorerBusiness
			.observeCurrentFolderContent(true, 'mediaExplorer')
			.select(function(folderContentVm) {
				return folderContentVm.links;
			});
	};

	var changeDir = function (folderPath) {
		var folderApiLink = '/api/explore' + folderPath;
		fileExplorerBusiness.changeFolderByApiLink(folderApiLink);
	};

	return {
		observeCurrentDir: observeCurrentDir,
		changeDir: changeDir
	}
});
