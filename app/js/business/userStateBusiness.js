'use strict';

jpoApp.factory('userStateBusiness', ['mediaQueueBusiness', '', '', function(mediaQueueBusiness) { //'$http', 'UserModel', 'serviceProxy',

	function loadStateAsync(){ // TODO Move to service
		var deferred = Q.defer();
		deferred.resolve({
			playedPosition: 10.0,
			volume: 100,
			mediaQueue: [
				'/api/playlists/54dac5d517acb1500781d5ae/media/54dac5d517acb1500781d5b2',
				'/api/explore/H:/Musiques/Dj Dean - If I Could Be You.mp3'
			],
			browsingFolderPath: '',
			openedPlaylistId: '',
			playingMediumInQueueIndex: 1
		});
		return deferred.promise;
	}

	return {

	}
}]);