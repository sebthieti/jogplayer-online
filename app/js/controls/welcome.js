'use strict';

jpoApp.directive("welcome", [function () {
	return {
		restrict: 'E',
		templateUrl: '/templates/controls/welcome.html'
	}
}]).directive("shakeOnInvalidCredentials", ['$animate', function($animate) {
	return {
		restrict: 'A',
		link: function(scope, element, attrs) {
			scope.$watch(attrs.shakeOnInvalidCredentials, function (logonStatus){
				switch (logonStatus) {
					case JpoAuthenticationStatus.LoggedIn:
						$animate.removeClass(element, 'shake');
						break;
					case JpoAuthenticationStatus.SessionExpired:
						break;
					case JpoAuthenticationStatus.InvalidCredentials:
						$animate
							.addClass(element, 'shake')
							.then(function() {
								$animate.removeClass(element, 'shake');
							});
						break;
				}
			})
		}
	}
}]);