jpoApp.factory('folderContentBuilder', function() {
	var linkHelper = Helpers.Link;

	return {
		buildFolderContentViewModel: function(folderContent) {
			var filesVm = folderContent.files.map(this.buildFolderViewModel);
			var links = folderContent.links;
			var parentDirPath = linkHelper.selectParentDirFromLinks(links);

			return { // TODO Assimilate to a viewModel
				files: filesVm,
				links: links,
				isActive: true,
				canExecuteFolderUp: angular.isDefined(parentDirPath)
			};
		},

		buildFolderViewModel: function (file) {
			var fileVm = file.clone();
			fileVm.selected = false;
			fileVm.hasError = false;
			return fileVm;
		}
	}
});