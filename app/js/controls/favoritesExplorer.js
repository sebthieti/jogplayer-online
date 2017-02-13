'use strict';

jpoApp.directive("favoritesExplorer", function (favoriteBusiness) {
	//var EntityStatus = JpoAppTypes.EntityStatus;

	return {
		restrict: 'E',
		templateUrl: '/templates/controls/favoritesExplorer.html',
		scope: {
			changeDirCmd: '&' // TODO I can use RxJs for that
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
				//$scope.changeDirCmd({ link: selectTargetLinkFromLinks(favorite.links) });
				favoriteBusiness.changeSelectedFavorite(favorite);
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
				return updateFavorite(favorite)
					.then(function(updatedFavorite) {
						updatedFavorite.isEditing = false;
						_currentIndexEdited = -1;
					});
			};

			$scope.innerDeleteFavorite = function(favorite) {
				favoriteBusiness.deleteFavoriteAsync(favorite);
			};

			var updateFavorite = function(favorite) {
				return favoriteBusiness.updateFavoriteAsync(favorite)
			};

			function handleUpdate(favoriteSet) {
				//if (favoriteSet.status !== EntityStatus.Updated) {
				//	return;
				//}
				//
				//_.each(favoriteSet.entity, function(favorite) {
				//	var favToUpdate =_.find($scope.favorites, function(fav) {
				//		return fav._id === favorite._id;
				//	});
				//
				//	var favIndex = $scope.favorites.indexOf(favToUpdate);
				//	$scope.favorites[favIndex] = favorite;
				//});
			}

			favoriteBusiness
				.getAndObserveFavorites()
				.do(function (favorites) {
					$scope.favorites = favorites;
				})
				//.do(handleUpdate)
				.subscribe(
					function(_) {},
					function(err) { console.log(err) } // TODO console.log should disappear in prod.
				); // TODO Handle a disposeWith method

		}
	}
});