'use strict';

jpoApp.directive("favoritesExplorer", ['viewModelBuilder', 'favoriteBusiness', function (viewModelBuilder, favoriteBusiness) {
	return {
		restrict: 'E',
		templateUrl: '/templates/controls/favoritesExplorer.html',
		controller: function ($scope) {
			var _currentIndexEdited = -1;

			$scope.goToFolder = function (favoriteVm) {
				favoriteBusiness.changeSelectedFavorite(favoriteVm.model);
			};

			$scope.editFavorite = function(fav) {
				if (_currentIndexEdited != -1) {
					$scope.favoritesVm[_currentIndexEdited].isEditing = false;
				}
				_currentIndexEdited = $scope.favoritesVm.indexOf(fav);
				fav.isEditing = true;
			};

			$scope.cancel = function(favorite) {
				_currentIndexEdited = -1;
				favorite.isEditing = false;
			};

			$scope.done = function(favorite) {
				return favoriteBusiness
					.updateFavoriteAsync(favorite.model)
					.then(function(updatedFavoriteModel) {
						var updatedFavVm = viewModelBuilder.buildFavoriteViewModel(updatedFavoriteModel);
						updatedFavVm.isEditing = false;

						$scope.favoritesVm[_currentIndexEdited] = updatedFavVm;
						_currentIndexEdited = -1;
					});
			};

			$scope.innerDeleteFavorite = function(favoriteVm) {
				favoriteBusiness.deleteFavoriteAsync(favoriteVm.model);
			};

			favoriteBusiness
				.observeFavorites()
				.whereHasValue()
				.do(function (favorites) {
					var favoritesVm = favorites.map(viewModelBuilder.buildFavoriteViewModel);
					$scope.favoritesVm = favoritesVm;
				})
				.silentSubscribe(); // TODO Handle a disposeWith method

			favoriteBusiness
				.observeFavorites()
				.whereIsNull()
				.do(function () {
					$scope.favoritesVm = null;
				})
				.silentSubscribe();

			//favoriteBusiness.loadFavorites();
		}
	}
}]);