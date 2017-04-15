var Q = require('q'),
	expect = require('chai').expect,
	chai = require("chai"),
	chaiAsPromised = require("chai-as-promised"),
	infrastructure = require('../../../infrastructure'),
	_ = require('underscore'),
	FavoriteDto = require('../../../infrastructure/dto').FavoriteDto,
	assert = require('assert'),
	mongoose = require('mongoose'),
	process = require('process');

chai.use(chaiAsPromised);

var container,
	favoriteDirector,
	authDirector,
	saveService;

before(function() {
	process.env.NODE_ENV = 'tests';

	infrastructure.initForUnitTests();
	container = infrastructure.giveContainer();
	favoriteDirector = container.get('favoriteDirector');
	authDirector = container.get('authDirector');
	saveService = container.get('saveService');
	return saveService
		.observeDbConnectionReady()
		.toPromise(); // Ensure Db connection is ready for the rest of tests
});

after(function() {
	// Graceful disconnect
	saveService.disconnectFromDb();
});

describe('FavoriteDirector', function() {
	it('should have favorite director set', function(){
		expect(favoriteDirector);
	});

	it('should not add favorite when no user set', function(){
		var defer = Q.defer();

		authDirector.verifyUser('master_user', 'testpass', function(res, user, other) {
			if (user === false) {
				defer.reject(other.message);
				return;
			}

			var favorite = FavoriteDto.toDto({
				name: 'Test fav',
				createdOn: new Date(),
				updatedOn: null,
				folderPath: 'C:\\FakePath\\',
				index: 0
			});

			favoriteDirector
				.addAsync(favorite)
				.then(function (fav) {
					assert(fav !== undefined, 'users should be defined');
					defer.reject('Should be in error');
				}, function(err) {
					defer.resolve(err);
				});

		});

		return defer.promise;
	});

	it('should not add favorite when no favorite set', function(){
		var defer = Q.defer();

		authDirector.verifyUser('master_user', 'testpass', function(res, user, other) {
			if (user === false) {
				defer.reject(other.message);
				return;
			}

			favoriteDirector
				.addAsync(null, user)
				.then(function (fav) {
					assert(fav !== undefined, 'users should be defined');
					defer.reject('Should be in error');
				}, function(err) {
					defer.resolve(err);
				});

		});

		return defer.promise;
	});

	it('should add favorite', function(){
		var defer = Q.defer();

		authDirector.verifyUser('master_user', 'testpass', function(res, user, other) {
			if (user === false) {
				defer.reject(other.message);
				return;
			}

			var favorite = FavoriteDto.toDto({
				name: 'Test fav',
				createdOn: new Date(),
				updatedOn: null,
				folderPath: 'C:\\FakePath\\',
				index: 0
			});

			favoriteDirector
				.addAsync(favorite, user)
				.then(function (fav) {
					assert(fav !== undefined, 'users should be defined');
					defer.resolve(fav);
				}, function(err) {
					defer.reject(err);
				});

		});

		return defer.promise;
	});

	it('should get favorite list', function(){
		var defer = Q.defer();

		authDirector.verifyUser('master_user', 'testpass', function(res, issuer, other) {
			if (issuer === false) {
				defer.reject(other.message);
				return;
			}

			return favoriteDirector
				.getAsync(issuer)
				.then(function (favorites) {
					expect(favorites.length).to.be.gte(0);
					defer.resolve(true);
				})
				.catch(function(err) {
					defer.reject(err);
				});
		});

		return defer.promise;
	});

	it('should update an existing favorite', function() {
		var defer = Q.defer();

		authDirector.verifyUser('master_user', 'testpass', function(res, issuer, other) {
			if (issuer === false) {
				defer.reject(other.message);
				return;
			}

			return favoriteDirector
				.getAsync(issuer)
				.then(function (favorites) {
					assert(favorites !== undefined, 'favorites should be defined');
					expect(favorites.length).to.be.gte(0);
					if (favorites.length === 0) {
						throw new Error('favorites should be defined');
					}

					return _.findWhere(favorites, { name: 'Test fav' });
				})
				.then(function(favorite) {
					var favDto = FavoriteDto.toDto({
						name: 'Test fav updated'
					});

					return favoriteDirector
						.updateFavoriteAsync(favorite.id, favDto, issuer)
						.then(function (fav) {
							assert(fav !== undefined, 'fav should be defined');
							expect(fav.name).to.be.equal('Test fav updated');
							defer.resolve(fav);
						});
				})
				.catch(function(err) {
					defer.reject(err);
				});
		});

		return defer.promise;
	});

	it('should remove favorite created for test', function(){
		var defer = Q.defer();

		authDirector.verifyUser('master_user', 'testpass', function(res, issuer, other) {
			if (issuer === false) {
				defer.reject(other.message);
				return;
			}

			return favoriteDirector
				.getAsync(issuer)
				.then(function (favorites) {
					assert(favorites !== undefined, 'favorites should be defined');
					expect(favorites.length).to.be.gte(0);
					if (favorites.length === 0) {
						throw new Error('favorites should be defined');
					}

					return _.findWhere(favorites, { name: 'Test fav updated' }); // This name comes from update test
				})
				.then(function(favorite) {
					return favoriteDirector.removeByIdAsync(favorite.id, issuer);
				})
				.then(function() {
					// Ensure favorite is really removed
					return favoriteDirector.getAsync(issuer)
				})
				.then(function (favorites) {
					var deletedFavorite = _.findWhere(favorites, { name: 'Test fav updated' });
					assert(deletedFavorite === undefined, 'favorite has not been deleted from db');
					if (deletedFavorite !== undefined) {
						throw new Error('favorite has not been deleted from db');
					}
					defer.resolve(true);
				})
				.catch(function(err) {
					defer.reject(err);
				});
		});

		return defer.promise;
	});
});
