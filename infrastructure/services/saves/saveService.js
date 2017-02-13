'use strict';

var Q = require('q'),
	mongodb = require('mongodb'),
	mongoose = require('mongoose');

// TODO The following should be a setting instead
var mongoUrl = "mongodb://localhost:27017/JogPlayerOnline";

//	var dbSet = null;
var _dbConnection = null;

var gracefulExit = function() {
	_dbConnection.disconnect();
};

var initDbClientAsync = function () {

	_dbConnection = mongoose.connect(mongoUrl);

	// If the Node process ends, close the Mongoose connection
	process.on('SIGINT', gracefulExit).on('SIGTERM', gracefulExit);


//		return Q.promise(function (onSuccess, onError) {
//			mongodb.MongoClient.connect(mongoUrl, function (err, db) {
//				if (!err) {
//					onSuccess(buildDbContext(db));
//				} else {
//					onError(err);
//				}
//			});
//		});
};
//

function SaveService () {
	initDbClientAsync();
}

module.exports = SaveService;


//	SaveService.prototype.getPlaylistsRepositoryAsync = function () {
//		return selectDbSubCollectionAsync(function(dbRepo) {
//			return dbRepo.playlists;
//		});
//	};
//
//	SaveService.prototype.getMediaRepositoryAsync = function () {
//		return selectDbSubCollectionAsync(function(dbRepo) {
//			return dbRepo.media;
//		});
//	};
//
//	SaveService.prototype.getBookmarksRepositoryAsync = function () {
//		return selectDbSubCollectionAsync(function(dbRepo) {
//			return dbRepo.bookmarks;
//		});
//	};
//
//	SaveService.prototype.getFavoritesRepositoryAsync = function () {
//		return selectDbSubCollectionAsync(function(dbRepo) {
//			return dbRepo.favorites;
//		});
//	};
//
//	SaveService.prototype.getConfigurationRepositoryAsync = function () {
//		return selectDbSubCollectionAsync(function(dbRepo) {
//			return dbRepo.configuration;
//		});
//	};

//	var selectDbSubCollectionAsync = function (selector) {
//		return ensureDbClientAsync()
//			.then(function (dbRepo) {
//				return selector(dbRepo);
//			});
//	};

//	var ensureDbClientAsync = function () {
//		if (dbSet) {
//			return Q.promise(function (onSuccess, onError) {
//				onSuccess(dbSet);
//			});
//		} else {
//			return initDbClientAsync();
//		}
//	};


//	var buildDbContext = function (db) {
//		dbSet = {
//			db: db,
//			playlists: db.collection("playlists"),
//			media: db.collection("media"),
//			bookmarks: db.collection("bookmarks"),
//			favorites: db.collection("favorites"),
//			configuration: db.collection("configuration")
//		};
//		return dbSet;
//	};


//})();