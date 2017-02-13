'use strict';

jpoApp.factory('loadBusiness', [
	'playlistBusiness',
	//'mediaQueueBusiness',
	'favoriteBusiness',
	function(playlistBusiness, favoriteBusiness) { //mediaQueueBusiness

		function observeAllResourcesLoaded() {
			return Rx.Observable.merge(
				playlistBusiness.observePlaylistViewModels(),
				favoriteBusiness.observeFavorites()
			).asAsyncValue().selectUnit()
				.select(function(x) {
					return x
				});
		}//mediaQueueBusiness

		return {
			observeAllResourcesLoaded: observeAllResourcesLoaded
		}
}]);