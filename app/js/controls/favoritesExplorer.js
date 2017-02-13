'use strict';

jpoApp.directive("favoritesExplorer", function () {
	return {
		restrict: 'E',
		templateUrl: '/templates/controls/favoritesExplorer.html',
		scope: {
			deleteFavorite: '&',
			updateFavorite: '&',
			favorites: '=',
			currentDirPath: '='
		},
		controller: function ($scope) {

			var _currentIndexEdited = -1;

			$scope.goToFolder = function (favorite) {
				$scope.currentDirPath = favorite.folderPath;
			};

			$scope.editFavorite = function(fav) {
				_currentIndexEdited = fav.index;
				fav.isEditing = true;
			};

			$scope.done = function(favorite) {
				// Proceed with update.
				$scope
					.updateFavorite({ favorite: favorite })
					.then(function(updatedFavorite) {
						updatedFavorite.isEditing = false;
						_currentIndexEdited = -1;
					});
				;
			};

			$scope.innerDeleteFavorite = function(favorite) {
				$scope.deleteFavorite({ favorite: favorite });
			};

		}
	}
});