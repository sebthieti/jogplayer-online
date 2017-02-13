'use strict';

jpoApp.directive("mediaQueue", ['mediaQueueBusiness', function (mediaQueueBusiness) {
	return {
		restrict: 'E',
		replace: true,
		templateUrl: '/templates/controls/mediaQueue.html',
		controller: function($scope, $timeout) {
			$scope.hasAny = false;

			$scope.playMedium = function(medium) {
				mediaQueueBusiness.playMedium(medium);
			};

			$scope.innerRemove = function(medium) {
				mediaQueueBusiness.removeMedium(medium);
			};

			$scope.clearQueue = function() {
				mediaQueueBusiness.clearQueue();
			};

			$scope.$watchCollection('mediaQueueViewModels', function(newMediaArray) {
				$scope.hasAny = _.any(newMediaArray);
			});

			mediaQueueBusiness
				.observeMediaQueue()
				.do(function(mediaQueueViewModels) {
					$timeout(function() {
						$scope.mediaQueueViewModels = mediaQueueViewModels;
					});
				})
				.silentSubscribe();

			mediaQueueBusiness
				.observeCurrentMediumInQueue()
				.whereIsNotNull()
				.selectWithPreviousValue(function(oldValue, newValue) {
					$timeout(function() {
						// If a medium is already playing, then unset it's playing status (the color change) and set the new one
						if (oldValue) { // TODO Can Still be an object but unlinked from array
							oldValue.isPlaying = false;
						}
						newValue.isPlaying = true;
						newValue.hasError = false;
					});
				})
				.silentSubscribe();

			mediaQueueBusiness
				.observeMediumError()
				.do(function(mediumInError) {
					$timeout(function() {
						mediumInError.hasError = true;
					});
				})
				.silentSubscribe()
		}
	};
}]);