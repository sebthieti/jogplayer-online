'use strict';

jpoApp.directive("playlistExplorer", function (playlistBusiness) {
	return {
		restrict: 'E',
		templateUrl: '/templates/controls/playlistExplorer.html',
		scope: {
			selectedMedia: '=',
			selectedPlaylist: '=',
			playMedia: '&',
			startExplore: '&'
		},
		controller: function($scope, $rootScope, $timeout, playlistService) {
			var linkHelper = Helpers.linkHelpers;
			$scope.playlists = null;
			//$scope.selectedPlaylist = null;
			$scope.selectedMedia = null;

			$scope.newPlaylist = null;
			$scope.isAdding = false;

			$scope.isPlaylistFinderVisible = false;




			$scope.selectedFile = null;
			$scope.beginAddPhysicalPlaylist = function() {
				// Toggle explorer visibility
				$scope.isPlaylistFinderVisible = true;

			};

			$scope.endAddPhysicalPlaylist = function() {
				var toAdd = linkHelper.selectSelfPhysicalFromLinks($scope.selectedFile[0].links);

				playlistService
					.addPhysicalPlaylist(toAdd)
					.then(function (playlist) {
						//$scope.playlists = playlists;
					}, function (err) {
					});
			};



			$scope.innerDeleteMedia = function(mediumToRemove) {
				return playlistService
					.removeMediumFromPlaylist(mediumToRemove)
					.then(function() {
						$scope.media = _.filter($scope.media, function(medium) {
							return medium._id !== mediumToRemove._id;
						});
					});
			};

			$scope.cancel = function(playlist) {
				if (angular.isDefined(playlist)) {
					playlist.isEditing = false;
				} else {
					$scope.isAdding = false;
				}
			};






			$scope.innerPlayMedia = function(media) {
				$scope.playMedia({ media: media, srcPlaylist: $scope.selectedPlaylist });

			};


			$scope.mediaSelected = function(media) {
				media.selected = !media.selected;

				$scope.selectedMedia = _.filter($scope.selectedPlaylist.media, function(media) {
					return media.selected;
				});
			};

			$scope.mediaValidated = function(media) {
				$scope.playMedia({ media: media });
			};

			$rootScope.$on('playlist.mediaInserted', function(event, args) {
				if ($scope.selectedPlaylist._id === args.playlistId) {
					$scope.media = $scope.media.concat (args.newMedia);
				}
			});




// BEGIN Playlist section

			$scope.innerRemovePlaylist = function(playlist) {
				playlistBusiness
					.removePlaylistAsync(playlist)
					.then(function() {
						$scope.selectedPlaylist = null;
					});
			};

			$scope.beginEditPlaylist = function(playlist) {
				playlist.isEditing = true;
			};

			$scope.endEditPlaylist = function(playlist) {
				playlistBusiness.updatePlaylistAsync(playlist)
					.then(function(updatedPlaylist) {
						updatedPlaylist.isEditing = false;
					});
			};

			$scope.innerPlaylistSelected = function(selectedPlaylist) {
				$scope.selectedPlaylist = selectedPlaylist;
				playlistBusiness.playlistSelected(selectedPlaylist); // TODO Rename to fireAndForget
			};

			$scope.beginAddVirtualPlaylist = function() {
				$scope.newPlaylist = {
					name: '',
					checked: true,
					media: []
				};

				$scope.isAdding = true;
			};

			$scope.endAddVirtualPlaylist = function() {
				playlistBusiness
					.addVirtualPlaylistAsync($scope.newPlaylist)
					.then(function(newPlaylist) {
						$scope.newPlaylist = null;
						//$scope.playlists = $scope.playlists.concat(newPlaylist);
						$scope.isAdding = false;
					});

				//playlistService
				//	.addPlaylist($scope.newPlaylist)
				//	.then(function(newPlaylist) {
				//		$scope.newPlaylist = null;
				//		$scope.playlists = $scope.playlists.concat(newPlaylist);
				//		$scope.isAdding = false;
				//	});
			};

// END Playlist section

// BEGIN Media section




// END Media section

// BEGIN Bootstrap section

			playlistBusiness
				.loadAndObservePlaylists()
				.do(function (playlists) {
					$scope.playlists = playlists;
				})
				.silentSubscribe();

			playlistBusiness
				.observeMedia()
				.do(function (mediaVm) {
					$scope.media = mediaVm;
					// playlist just contain id list, so now feed it
					$scope.selectedPlaylist.media = mediaVm;
				})
				.silentSubscribe();

// END Bootstrap section
		}
	}
});