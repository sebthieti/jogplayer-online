jpoApp.directive('ngEnter', function () {
	return function (scope, element, attrs) {
		element.bind("keydown keypress", function (event) {
			if(event.which === 13) {
				scope.$apply(function (){
					scope.$eval(attrs.ngEnter);
				});

				event.preventDefault();
			}
		});
	};
}).directive('focusWhen', function ($timeout, $parse) {
	return function (scope, element, attrs) {
		var model = $parse(attrs.focusWhen);
		scope.$watch(model, function(value) {
			if(value === true) {
				$timeout(function() {
					element[0].focus();
				});
			}
		});
	};
});