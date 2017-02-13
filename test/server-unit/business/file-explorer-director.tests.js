var Q = require('q'),
	path = require('path');
	infrastructure = require('../../../infrastructure'),
	_ = require('underscore'),
	assert = require('assert'),
	mongoose = require('mongoose');

var container,
	fileExplorerDirector,
	saveService,
	authDirector,
	Models;

before(function() {
	process.env.NODE_ENV = 'tests';

	infrastructure.initForUnitTests();
	container = infrastructure.giveContainer();

	fileExplorerDirector = container.get('fileExplorerDirector');
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

describe('FileExplorerDirector', function() {
	it('should give folder content', function(){
		var defer = Q.defer();

		authDirector.verifyUser('master_user', 'testpass', function(res, issuer, other) {
			if (issuer === false) {
				defer.reject(other.message);
				return;
			}

			var testPath = ('/' + path.join(process.cwd(), 'test')).replace(/\\/g, '/');
			return fileExplorerDirector
				.getFolderContentAsync(testPath, issuer)
				.then(function (folderContent) {
					assert(folderContent !== undefined, 'folderContent should be defined');
					assert(folderContent.files && folderContent.files.length >= 0, 'Invalid files array size');
					assert(folderContent.links && folderContent.links.length >= 0, 'Invalid links array size');
					defer.resolve(folderContent);
				})
				.catch(function(err) {
					defer.reject(err);
				});
			});

		return defer.promise;
	});

	it('should add root user with permissions', function(){
		var defer = Q.defer();

		authDirector.verifyUser('master_user', 'testpass', function(res, issuer, other) {
			if (issuer === false) {
				defer.reject(other.message);
				return;
			}

			var testPath = ('/' + path.join(process.cwd(), 'test')).replace(/\\/g, '/');
			return fileExplorerDirector
				.getFileInfoAsync(testPath, issuer)
				.then(function (fileInfo) {
					assert(fileInfo !== undefined, 'users should be defined');
					defer.resolve(fileInfo);
				})
				.catch(function(err) {
					defer.reject(err);
				});
			});

		return defer.promise;
	});
});
