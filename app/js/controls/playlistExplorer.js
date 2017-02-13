'use strict';

jpoApp.directive("playlistExplorer", function () {
	return {
		restrict: 'E',
		templateUrl: '/templates/controls/playlistExplorer.html',
		scope: {
			selectedMedia: '=',
			selectedPlaylist: '=',
			playMedia: '&'
			//addPlaylist: '&',
			//playlistSelected: '&'
		},
		controller: function($scope, $rootScope, $timeout, playlistService) {

			$scope.playlists = null;
			//$scope.selectedPlaylist = null;
			$scope.selectedMedia = null;

			$scope.newPlaylist = null;
			$scope.isAdding = false;

			$scope.beginAddPlaylist = function() {
				$scope.newPlaylist = {
					name: '',
					checked: true,
					media: []
				};

				$scope.isAdding = true;
			};

			$scope.endAddPlaylist = function() {
				playlistService
					.addPlaylist($scope.newPlaylist)
					.then(function(newPlaylist) {
						$scope.newPlaylist = null;
						$scope.playlists = $scope.playlists.concat(newPlaylist);
						$scope.isAdding = false;
					});
			};

			$scope.beginEditPlaylist = function(playlist) {
				playlist.isEditing = true;
			};

			$scope.endEditPlaylist = function(playlist) {
				return playlistService
					.updatePlaylist(playlist)
					.then(function(updatedPlaylist) {
						$scope.playlists[playlist.index] = updatedPlaylist;
						updatedPlaylist.isEditing = false;
					});
			};

			$scope.innerDeleteMedia = function(mediumToRemove) {
				return playlistService
					.removeMediaFromPlaylist($scope.selectedPlaylist._id, mediumToRemove._id)
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

			$scope.innerPlaylistSelected = function(selectedPlaylist) {
				$scope.selectedPlaylist = selectedPlaylist;

//				if (angular.isDefined($scope.playlistSelected)) {
//					$scope.playlistSelected({ playlist: selectedPlaylist });
//				}

				playlistService.getPlaylistMedia(selectedPlaylist._id)
					.then(function (media) {
						_.forEach(media, function(medium) {
							medium.isPlaying = false;
						});
						$scope.media = media;
						// playlist just contain id list, so now feed it
						$scope.selectedPlaylist.media = media;
					}, function (err) {
					});
			};


			$scope.innerRemovePlaylist = function(playlist) {
				playlistService
					.removePlaylist(playlist)
					.then(function() {
						$scope.playlists = _.filter($scope.playlists, function(pl) {
							return pl._id !== playlist._id;
						});
					});
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

			playlistService
				.getPlaylists()
				.then(function (playlists) {
					$scope.playlists = playlists;
				}, function (err) {
				});
		}
	}
});