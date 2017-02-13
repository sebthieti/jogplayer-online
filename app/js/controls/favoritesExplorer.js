'use strict';

jpoApp.directive("favoritesExplorer", function () {
	return {
		restrict: 'E',
		templateUrl: '/templates/controls/favoritesExplorer.html',
		scope: {
			deleteFavorite: '&',
			updateFavorite: '&',
			favorites: '=',
			changeDirCmd: '&'
			//currentDirPath: '='
		},
		controller: function ($scope) {

			var _currentIndexEdited = -1;

			var selectTargetLinkFromLinks = function(links) {
				var link = _.find(links, function(link) {
					return link.rel === 'target';
				});
				if (link) {
					return link;
				}
			};


			$scope.goToFolder = function (favorite) {
				//$scope.currentDirPath = favorite.folderPath;
				$scope.changeDirCmd({ link: selectTargetLinkFromLinks(favorite.links) })
			};

			$scope.editFavorite = function(fav) {
				if (_currentIndexEdited != -1) {
					$scope.favorites[_currentIndexEdited].isEditing = false;
				}
				_currentIndexEdited = $scope.favorites.indexOf(fav);
				fav.isEditing = true;
			};

			$scope.cancel = function(favorite) {
				_currentIndexEdited = -1;
				favorite.isEditing = false;
			};

			$scope.done = function(favorite) {
				// Proceed with update.
				$scope
					.updateFavorite({ favorite: favorite })
					.then(function(updatedFavorite) {
						updatedFavorite.isEditing = false;
						_currentIndexEdited = -1;
					});
			};

			$scope.innerDeleteFavorite = function(favorite) {
				$scope.deleteFavorite({ favorite: favorite });
			};

		}
	}
});