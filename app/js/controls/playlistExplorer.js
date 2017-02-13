'use strict';

jpoApp.directive("playlistExplorer", [
	'$timeout',
	'playlistBusiness',
	'mediaBusiness',
	'mediaQueueBusiness',
	'playlistBuilder',
	'viewModelBuilder',
	function ($timeout, playlistBusiness, mediaBusiness, mediaQueueBusiness, playlistBuilder, viewModelBuilder) {
		return {
			restrict: 'E',
			templateUrl: '/templates/controls/playlistExplorer.html',
			controller: function($scope) {
				var _currentIndexEdited = -1;

				$scope.playlists = null;
				$scope.selectedMedia = null;
				$scope.newPlaylist = null;
				$scope.isAdding = false;
				$scope.isPlaylistFinderVisible = false;
				$scope.selectedPlaylistFiles = [];
				$scope.canShowMediaInPlaylist = true;
				$scope.hasMediaQueueAny = false;

// BEGIN Add physical playlist

				$scope.beginAddPhysicalPlaylist = function() {
					// Toggle explorer visibility
					$scope.isPlaylistFinderVisible = true;
				};

				$scope.endAddPhysicalPlaylist = function() {
					$scope.isPlaylistFinderVisible = false;
					playlistBusiness.addPhysicalPlaylistsByFilePathsAsync($scope.selectedPlaylistFiles);
				};

				$scope.cancelImport = function() {
					$scope.isPlaylistFinderVisible = false;
				};

// END Add physical playlist

				$scope.cancelAddPlaylist = function(playlistVm) {
					if (angular.isDefined(playlistVm)) {
						playlistVm.isEditing = false;
					} else {
						$scope.isAdding = false;
					}
					_currentIndexEdited = -1;
				};

				$scope.$watch("selectedPlaylistFiles", function (newSelection) {
					$scope.canValidateSelection = _.any(newSelection);
				});

				// Link PlaylistFinder Validator with PlaylistFinder on visibility
				$scope.$watch("isPlaylistFinderVisible", function (isVisible) {
					$scope.canShowMediaInPlaylist = !isVisible;
					$scope.canShowPlaylistFinderValidate = isVisible;
				});

				$scope.mediaSelected = function(media) {
					media.selected = !media.selected;

					$scope.selectedMedia = _.filter($scope.selectedPlaylist.media, function(media) {
						return media.selected;
					});

					mediaBusiness.changeMediaSelection($scope.selectedMedia);
				};

	// BEGIN Playlist section

				$scope.innerRemovePlaylist = function(playlistVm) {
					playlistBusiness
						.removePlaylistAsync(playlistVm.model)
						.then(function() {
							$scope.selectedPlaylist = null;
						});
				};

				$scope.beginEditPlaylist = function(playlistVm) {
					if (_currentIndexEdited != -1) {
						$scope.playlistsVm[_currentIndexEdited].isEditing = false;
					}
					_currentIndexEdited = $scope.playlistsVm.indexOf(playlistVm);
					playlistVm.isEditing = true;
				};

				$scope.endEditPlaylist = function(playlistVm) {
					playlistBusiness
						.updatePlaylistAsync(playlistVm.model)
						.then(function(updatedPlaylist) {
							var playlistVm = viewModelBuilder.buildEditableViewModel(updatedPlaylist);
							playlistVm.isEditing = false;

							$scope.playlistsVm[_currentIndexEdited] = playlistVm;
							_currentIndexEdited = -1;
						});
				};

				$scope.innerPlaylistSelected = function(playlistVm) {
					$scope.selectedPlaylist = playlistVm;
					playlistBusiness.playlistSelected(playlistVm); // TODO Rename to fireAndForget
				};

				$scope.beginAddVirtualPlaylist = function() {
					$scope.newPlaylist = playlistBuilder.buildEmptyPlaylist();
					$scope.isAdding = true;
				};

				$scope.endAddVirtualPlaylist = function() {
					playlistBusiness
						.addVirtualPlaylistAsync($scope.newPlaylist)
						.then(function(__) {
							$scope.newPlaylist = null;
							$scope.isAdding = false;
						});
				};

	// END Playlist section

	// BEGIN Media section

				$scope.innerRemoveMedium = function(mediumToRemove) {
					playlistBusiness.removeMediumFromPlaylist(mediumToRemove.model);
				};

				$scope.innerPlayMedium = function(medium) {
					playlistBusiness.playMedium(medium);
				};

	// END Media section

	// BEGIN Bootstrap section

				playlistBusiness
					.observePlaylistViewModels()
					.whereHasValue()
					.do(function (playlistsVm) {
						$scope.playlistsVm = playlistsVm;
					})
					.silentSubscribe();

				playlistBusiness
					.observePlaylistViewModels()
					.whereIsNull()
					.do(function () {
						$scope.playlistsVm = null;
					})
					.silentSubscribe();

				playlistBusiness
					.observePlayingMedium()
					.selectWithPreviousValue(function(oldPlayingMedium, newPlayingMedium) {
						oldPlayingMedium.getValueAsync(function(medium) {
							$timeout(function() {
								medium.isPlaying = false;
							});
						});
						newPlayingMedium.getValueAsync(function(medium) {
							$timeout(function() {
								medium.isPlaying = true;
							});
						});
					})
					.silentSubscribe();

	// END Bootstrap section

				mediaQueueBusiness
					.observeMediaQueue()
					.whereHasValue()
					.select(function(x) {return _.any(x)})
					.do(function(hasMediaQueueAny) {
						$scope.hasMediaQueueAny = hasMediaQueueAny;
					})
					.silentSubscribe();
			}
		}
}]);