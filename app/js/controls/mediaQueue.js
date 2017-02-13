'use strict';

jpoApp.directive("mediaQueue", function () {
	return {
		restrict: 'E',
		replace: true,
		templateUrl: '/templates/controls/mediaQueue.html',
		scope: {
			mediaQueue: '=queuedMedia', // Means looks for folder-path attribute (= for object, & for function in parent scope, @ for just string or computed like {{}})
			currentMediaInQueue: '=',
			playMedia: '&',
			remove: '&',
			clearQueue: '&'
		},
		controller: function($scope) {

			$scope.innerPlayMedia = function(media) {
				$scope.playMedia({ media: media });
			};

			$scope.innerRemove = function(media) {
				$scope.remove({ media: media });
			};

			// TODO Should this directive change this ?
			$scope.$watch('currentMediaInQueue', function(newValue, oldValue) {
				// When this one updates, we have to change current visible media
				if (oldValue) {
					oldValue.isPlaying = false;
				}
				if (newValue) {
					newValue.isPlaying = true;
				}
			});

		}
	};
});