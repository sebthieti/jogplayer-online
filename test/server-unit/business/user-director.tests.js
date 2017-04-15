var Q = require('q'),
	infrastructure = require('../../../infrastructure'),
	_ = require('underscore'),
	UserDto = require('../../../infrastructure/dto').UserDto,
	UserPermissionsDto = require('../../../infrastructure/dto').UserPermissionsDto,
	assert = require('assert'),
	mongoose = require('mongoose');

var container,
	userDirector,
	testUserId,
	saveService,
	authDirector,
	Models;

before(function() {
	process.env.NODE_ENV = 'tests';

	infrastructure.initForUnitTests();
	container = infrastructure.giveContainer();

	userDirector = container.get('userDirector');
	authDirector = container.get('authDirector');
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

describe('UserDirector', function() {
	it('should give is root user set', function(){
		return userDirector
			.isRootUserSetAsync()
			.then(function (isRootUserSet) {
				assert(isRootUserSet !== undefined, 'isRootUserSet should be defined');
			});
	});

	it('should add root user with permissions', function(){
		var userDto = UserDto.toDto({
			username: 'master_user',
			password: 'testpass',
			fullName: 'A full name'
		});

		return userDirector
			.addRootUserAsync(userDto)
			.then(function (user) {
				assert(user !== undefined, 'users should be defined');
				testUserId = user.id;
			});
	});

	it('should give users', function(){
		var defer = Q.defer();

		authDirector.verifyUser('master_user', 'testpass', function(res, user, other) {
			if (user === false) {
				defer.reject(other.message);
				return;
			}

			userDirector
				.getUsersAsync(user)
				.then(function (users) {
					assert(users !== undefined, 'users should be defined');
					assert(users.length >= 0, 'Invalid array size');
					defer.resolve(users);
				}, function(err) {
					defer.reject(err);
				});

		});

		return defer.promise;
	});

	it('should add user', function(){
		var defer = Q.defer();

		var userDto = UserDto.toDto({
			username: 'regular_user',
			password: 'testpass',
			fullName: 'A full name'
		});
		authDirector.verifyUser('master_user', 'testpass', function(res, issuer, other) {
			if (issuer === false) {
				defer.reject(other.message);
				return;
			}

			userDirector
				.addUserWithDefaultPermissionsAsync(userDto, issuer)
				.then(function (user) {
					assert(user !== undefined, 'users should be defined');
					defer.resolve(user);
				})
				.catch(function(err) {
					defer.reject(err);
				});
		});

		return defer.promise;
	});

	it('should update user', function(){
		var defer = Q.defer();
		authDirector.verifyUser('master_user', 'testpass', function(res, issuer, other) {
			if (issuer === false) {
				defer.reject(other.message);
				return;
			}

			userDirector
				.getUsersAsync(issuer)
				.then(function(users) {
					return _.findWhere(users, { username: 'regular_user' })
				})
				.then(function(user) {
					assert(user !== undefined, 'get user: users should be defined');

					var userDto = UserDto.toDto({
						username: 'regular_user',
						fullName: 'updated fullName',
						fullName: 'A full name'
					});
					return userDirector
						.updateUserAsync(user.id, userDto, issuer)
						.then(function (userPermissions) {
							assert(userPermissions !== undefined, 'user permissions: users should be defined');
							defer.resolve(userPermissions);
						});
				})
				.catch(function(err) {
					defer.reject(err);
				});
		});

		return defer.promise;
	});

	it('should update user permissions', function(){
		var defer = Q.defer();
		authDirector.verifyUser('master_user', 'testpass', function(res, issuer, other) {
			if (issuer === false) {
				defer.reject(other.message);
				return;
			}

			userDirector
				.getUsersAsync(issuer)
				.then(function(users) {
					return _.findWhere(users, { username: 'regular_user' })
				})
				.then(function(user) {
					assert(user !== undefined, 'get user: users should be defined');

					var userPermDto = UserPermissionsDto.toDto({
						canWrite: true,
						allowPaths: ['C:\\FakePath1', 'C:\\FakePath2'],
						homePath: 'C:\\FakePath2'
					});
					return userDirector
						.updateUserPermissionsAsync(user.id, userPermDto, issuer)
						.then(function (userPermissions) {
							assert(userPermissions !== undefined, 'user permissions: users should be defined');
							defer.resolve(userPermissions);
						});
				})
				.catch(function(err) {
					defer.reject(err);
				});
		});

		return defer.promise;
	});

	it('should remove test user', function(){
		var defer = Q.defer();
		authDirector.verifyUser('master_user', 'testpass', function(res, issuer, other) {
			if (issuer === false) {
				defer.reject(other.message);
				return;
			}

			userDirector
				.getUsersAsync(issuer)
				.then(function(users) {
					return _.findWhere(users, { username: 'regular_user' })
				})
				.then(function(user) {
					assert(user !== undefined, 'get user: users should be defined');

					return userDirector
						.removeUserByIdAsync(user.id, issuer)
						.then(function () {
							defer.resolve(true);
						})
						.catch(function(err) {
							defer.reject(err);
						});
				})
				.catch(function(err) {
					defer.reject(err);
				});
		});

		return defer.promise;
	});
});
