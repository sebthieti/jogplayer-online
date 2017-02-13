'use strict';

angular.module('jpoApp.controllers', []).controller('mainCtrl', [
	'$scope',
	'audioPlayerBusiness',
	function($scope, audioPlayerBusiness) {
		audioPlayerBusiness
			.observePlayingMedium()
			.select(function(x) {return x.model})
			.startWith(null)
			.do(function(medium) {
				if (!medium) {
					$scope.pageTitle = 'JogPlayer Online';
				} else {
					var nameOrTitle = medium.title || medium.name;
					$scope.pageTitle = nameOrTitle + " - JogPlayer Online";
				}
			})
			.silentSubscribe();
	}
]);