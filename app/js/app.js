'use strict';

// Declare app level module which depends on filters, and services
var jpoApp = angular.module('jpoApp', [
	'ngRoute',
	'jpoApp.controllers',
	'jpoApp.filters',
	'jpoApp.services',
	'jpoApp.directives'
]).
config(['$routeProvider', function($routeProvider) {
	$routeProvider
		.when('/view1', {
			templateUrl: 'partials/view1.html',
			controller: 'MyCtrl1'
		})
		.otherwise({
			redirectTo: '/view1'
		});
}]);