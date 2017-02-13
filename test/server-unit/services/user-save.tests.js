var infrastructure = require('../../../infrastructure'),
	_ = require('underscore'),
	UserDto = require('../../../infrastructure/dto').UserDto,
	assert = require('assert'),
	mongoose = require('mongoose');

var container,
	userSaveService,
	saveService,
	userPermissionsSaveService,
	Models;

before(function() {
	process.env.NODE_ENV = 'tests';

	infrastructure.initForUnitTests();
	container = infrastructure.giveContainer();
	userPermissionsSaveService = container.get('userPermissionsSaveService');
	userSaveService = container.get('userSaveService');
	saveService = container.get('saveService');
	Models = container.get('Models');

	return saveService
		.observeDbConnectionReady()
		.toPromise(); // Ensure Db connection is ready for the rest of tests
});

after(function() {
	// Graceful disconnect
	saveService.disconnectFromDb();
});

describe('UserSaves', function() {
	it('should give is root user set', function(){
		return userSaveService
			.isRootUserSetAsync()
			.then(function (isRootUserSet) {
				assert(isRootUserSet !== undefined, 'isRootUserSet should be defined');
			});
	});

	it('should give users', function(){
		return userSaveService
			.getUsersAsync()
			.then(function (users) {
				assert(users !== undefined, 'users should be defined');
				assert(users.length >= 0, 'Invalid array size')
			});
	});

});
