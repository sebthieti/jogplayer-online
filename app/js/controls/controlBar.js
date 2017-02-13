'use strict';

jpoApp.directive("controlBar", [
	'favoriteBusiness',
	'playlistBusiness',
	'mediaBusiness',
	'fileExplorerBusiness',
	'mediaQueueBusiness',
	function(favoriteBusiness, playlistBusiness, mediaBusiness, fileExplorerBusiness, mediaQueueBusiness) {
		var linkHelpers = Helpers.linkHelpers;
		return {
			restrict: 'E',
			templateUrl: '/templates/controls/controlBar.html',
			controller: function($scope) {
				$scope.canAddFilesToPlaylist = false;
				$scope.canAddFolderToFavorites = false;
				$scope.canEnqueueMediaSelection = false;
				$scope.canEnqueueFileSelection = false;

				mediaBusiness
					.getAndObserveHasMediaSelection()
					.do(function(hasSelection) {
						$scope.canEnqueueMediaSelection = hasSelection;
					})
					.silentSubscribe();

				fileExplorerBusiness
					.getAndObserveHasFileSelection()
					.combineLatest(playlistBusiness.observeCurrentPlaylist(), function (hasFileSelection, currentPlaylist){
						$scope.canAddFilesToPlaylist = hasFileSelection && angular.isDefined(currentPlaylist);
					})
					.silentSubscribe();

				fileExplorerBusiness
					.getAndObserveHasFileSelection()
					.do(function (hasFileSelection){
						$scope.canEnqueueFileSelection = hasFileSelection;
					})
					.silentSubscribe();

				fileExplorerBusiness
					.observeCurrentFolderContent()
					.do(function(isBrowsing) {
						$scope.canAddFolderToFavorites = isBrowsing;
					})
					.silentSubscribe();

				$scope.addFolderToFavoritesCmd = function() {
					fileExplorerBusiness
						.observeCurrentFolderContent()
						.getValueAsync(function(folderContent) {
							var folderPath = linkHelpers.selectSelfPhysicalFromLinks(folderContent.links);
							favoriteBusiness.addFolderToFavoritesAsync(folderPath);
						});
				};

				$scope.addFilesToPlaylist = function() {
					fileExplorerBusiness
						.observeFileSelection()
						.asAsyncValue()
						.where(function(fileSelection) { return _.any(fileSelection) })
						.do(function(fileSelection) {
							playlistBusiness.addFilesToSelectedPlaylist(fileSelection);
						})
						.silentSubscribe();
				};

				$scope.enqueueMediaSelection = function () {
					mediaBusiness
						.observeMediaSelection()
						.select(function(mediaViewModelsSelection) {return mediaViewModelsSelection.map(function(m){return m.model})})
						.getValueAsync(function(mediaModelsSelection) {
							mediaQueueBusiness.enqueueMedia(mediaModelsSelection);
						});
				};

				$scope.enqueueFileSelection = function () {
					fileExplorerBusiness
						.observeFileSelection()
						.select(function(fileViewModel) {
							return fileViewModel.map(function(f){return f.model})})
						.getValueAsync(function(fileModels) {
							mediaQueueBusiness.enqueueMedia(fileModels);
						});
				};
			}
		}
}]);