'use strict';

jpoApp.directive("userSummary", function() {
	return {
		restrict: 'E',
		scope: {userVm: '=?'},
		templateUrl: '/templates/controls/userSummary.html'
	};
});