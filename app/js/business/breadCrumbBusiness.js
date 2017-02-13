'use strict';

jpoApp.factory('breadCrumbBusiness', function(fileExplorerBusiness) {
	var observeCurrentDir = function () {
		return fileExplorerBusiness
			.observeCurrentFolderContent()
			.select(function(folderContentVm) {
				return folderContentVm.links;
			});
	};

	var changeDir = function (folderPath) {
		var folderApiLink = '/api/explore' + folderPath;
		fileExplorerBusiness.changeFolderByApiLinkAndResetSelection(folderApiLink);
	};

	return {
		observeCurrentDir: observeCurrentDir,
		changeDir: changeDir
	}
});
