'use strict';

jpoApp.factory("FileNavigator", ['SelectorBase', function (SelectorBase) {
	function FileNavigator() {
		var base = new SelectorBase();

		return {
			controller: function ($scope, explorerBusiness) {
				this.explorerBusiness = explorerBusiness;
				base.controller($scope, explorerBusiness);

				$scope.goUp = function (folderViewModel) {
					explorerBusiness.goUp(folderViewModel);
				};

				$scope.fileSelected = function (fileViewModel) {
					var isBrowsable = !fileViewModel.model.type || fileViewModel.model.isDirectory();
					if (isBrowsable) {
						explorerBusiness.browseFolder(fileViewModel.model);
					} else {
						base.updateFileSelection(fileViewModel);
					}
				}
			},

			goUp: function (folderViewModel) {
				this.explorerBusiness.goUp(folderViewModel);
			},

			fileSelected: function (fileViewModel) {
				var isBrowsable = !fileViewModel.model.type || fileViewModel.model.isDirectory();
				if (isBrowsable) {
					this.explorerBusiness.browseFolder(fileViewModel.model);
				} else {
					base.updateFileSelection(fileViewModel);
				}
			},

			link: function (controller) { // TODO Do proto. inheritance
				base.link(controller);
			}
		}
	}

	return FileNavigator;
}]);

jpoApp.factory("SelectorBase", ['$window', function ($window) {
	var SelectionMode = {
		Single: 'single',
		Grouped: 'grouped',
		KeepEach: 'keep-each'
	};

	var KeyCode = {
		Ctrl: 17,
		Shift: 16
	};

	function SelectorBase() {
		return {
			controller: function ($scope, explorerBusiness) {
				this.$scope = $scope; // TODO think on having $scope available out of scope
				this.explorerBusiness = explorerBusiness;
				this._selectionMode = SelectionMode.Single;
				this._lastSelectedFileViewModel = null;
			},

			updateFileSelection: function (fileViewModel) {
				switch (this._selectionMode) {
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
				this._lastSelectedFileViewModel = fileViewModel;
			},

			singleMediaSelection: function (fileViewModel) {
				// Un-select all media.
				_.each(this.$scope.folderViewModel.files, function (fileVm) {
					if (fileVm !== fileViewModel) {
						fileVm.selected = false;
					}
				});
				// Toggle selection for selected file.
				fileViewModel.selected = !fileViewModel.selected;
				// Finally update selected files
				this.updateSelectedFiles();
			},

			multipleMediaSelection: function (fileViewModel) {
				// Toggle selection for selected file.
				fileViewModel.selected = !fileViewModel.selected;
				// Finally update selected files
				this.updateSelectedFiles();
			},

			inlineMediaSelection: function (fileViewModel) {
				var filesViewModels = this.$scope.folderViewModel.files;
				var fileIndex = _.indexOf(filesViewModels, fileViewModel);
				var startIndex, endIndex;
				// If one file has been selected before, use it as the first to select.
				// So, set startIndex and endIndex to properly select media
				if (this._lastSelectedFileViewModel) {
					// Un-select all media
					_.each(filesViewModels, function (fileVm) {
						if (fileVm !== fileViewModel) {
							fileVm.selected = false;
						}
					});
					// Select from previous last selected file to selected file
					var lastSelectedFileIndex = _.indexOf(filesViewModels, this._lastSelectedFileViewModel);
					startIndex = Math.min(lastSelectedFileIndex, fileIndex);
					endIndex = Math.max(lastSelectedFileIndex, fileIndex);
				} else {
					startIndex = 0;
					endIndex = fileIndex;
				}
				// Select files.
				for (var index = startIndex; index <= endIndex; index++) {
					filesViewModels[index].selected = true;
				}
				// Finally update selected files
				this.updateSelectedFiles();
			},

			updateSelectedFiles: function () {
				var fileSelection = _.filter(this.$scope.folderViewModel.files, function (file) {
					return file.selected;
				});
				this.$scope.selectedFiles = fileSelection;
				this.explorerBusiness.updateFileSelection(fileSelection);
			},

			link: function () {
				var self = this;
				var _defaultMode = SelectionMode.Single,
					_currentMode = _defaultMode;

				$window.addEventListener('keydown', function (event) {
					var lastMode = _currentMode;
					switch (event.keyCode) {
						case KeyCode.Ctrl:
							_currentMode = SelectionMode.KeepEach;
							break;
						case KeyCode.Shift:
							_currentMode = SelectionMode.Grouped;
							break;
						default:
							_currentMode = _defaultMode;
							break;
					}
					// TODO Should rather listen to an observable for keydown but for all window (here only )
					if (_currentMode !== lastMode) {
						updateSelectionMode(_currentMode);
					}
				});

				$window.addEventListener('keyup', function () {
					if (_currentMode === _defaultMode) {
						return;
					}
					_currentMode = _defaultMode;
					updateSelectionMode(_currentMode);
				});

				var updateSelectionMode = function (mode) {
					self.updateSelectionMode(mode);
				};

				updateSelectionMode(_currentMode);
			},

			updateSelectionMode: function (mode) {
				this._selectionMode = mode;
			}
		};
	}
	return SelectorBase;
}]);