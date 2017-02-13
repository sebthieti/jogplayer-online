var Q = require('q'),
	mongodb = require('mongodb');

module.exports = (function () {
	'use strict';

	// TODO The following should be a setting instead
	var mongoUrl = "mongodb://localhost:27017/JogPlayerOnline";

	var dbSet = null;

	function SaveService () {
	}

	SaveService.prototype.getPlaylistsRepositoryAsync = function () {
		return selectDbSubCollectionAsync(function(dbRepo) {
			return dbRepo.playlists;
		});
	};

	SaveService.prototype.getMediasRepositoryAsync = function () {
		return selectDbSubCollectionAsync(function(dbRepo) {
			return dbRepo.medias;
		});
	};

	SaveService.prototype.getBookmarksRepositoryAsync = function () {
		return selectDbSubCollectionAsync(function(dbRepo) {
			return dbRepo.bookmarks;
		});
	};

	SaveService.prototype.getFavoritesRepositoryAsync = function () {
		return selectDbSubCollectionAsync(function(dbRepo) {
			return dbRepo.favorites;
		});
	};

	SaveService.prototype.getConfigurationRepositoryAsync = function () {
		return selectDbSubCollectionAsync(function(dbRepo) {
			return dbRepo.configuration;
		});
	};

	var selectDbSubCollectionAsync = function (selector) {
		return ensureDbClientAsync()
			.then(function (dbRepo) {
				return selector(dbRepo);
			});
	};

	var ensureDbClientAsync = function () {
		if (dbSet) {
			return Q.promise(function (onSuccess, onError) {
				onSuccess(dbSet);
			});
		} else {
			return initDbClientAsync();
		}
	};

	var initDbClientAsync = function () {
		return Q.promise(function (onSuccess, onError) {
			mongodb.MongoClient.connect(mongoUrl, function (err, db) {
				if (!err) {
					onSuccess(buildDbContext(db));
				} else {
					onError(err);
				}
			});
		});
	};

	var buildDbContext = function (db) {
		dbSet = {
			db: db,
			playlists: db.collection("playlists"),
			medias: db.collection("medias"),
			bookmarks: db.collection("bookmarks"),
			favorites: db.collection("favorites"),
			configuration: db.collection("configuration")
		};
		return dbSet;
	};

	return SaveService;
})();