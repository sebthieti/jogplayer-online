jpoApp.factory('folderContentBuilder', function() {
	var linkHelper = Helpers.linkHelpers;

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

jpoApp.factory('playlistBuilder', function() {
	return {
		buildEmptyPlaylist: function () {
			return {
				name: '',
				checked: true,
				media: []
			}
		}
	}
});

jpoApp.factory('viewModelBuilder', function() {
	return {
		buildFavoriteViewModel: function (model) {
			return {
				model: model/*.clone()*/,
				isEditing: false
			}
		},

		buildMediumViewModel: function (model) {
			return {
				model: model/*.clone()*/,
				isPlaying: false
			}
		},

		buildEditableViewModel: function (model) {
			return {
				model: model/*.clone()*/,
				isEditing: false
			}
		},

		buildFolderContentViewModel: function(folderContent) {
			var filesVm = folderContent.files.map(this.buildFolderViewModel);
			return {
				model: folderContent,
				files: filesVm,
				canExecuteFolderUp: folderContent.hasParentDir()
			};
		},

		buildFolderViewModel: function (file) {
			return {
				model: file/*.clone()*/,
				selected: false,
				hasError: false
			};
		},

		buildQueuedMediumViewModel: function (mediumModel) {
			return {
				model: mediumModel/*.clone()*/,
				hasError: false,
				isPlaying: false
			};
		}
	}
});