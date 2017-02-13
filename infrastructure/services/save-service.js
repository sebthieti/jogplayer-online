var Q = require('q');
var mongodb = require('mongodb');

var SaveService = (function () {
	'use strict'

	function SaveService () {

		var dbSet = null;
		// TODO The following should be a setting instead
		var mongoUrl = "mongodb://localhost:27017/JogPlayerOnline";


		this.getPlaylistsRepositoryAsync = function () {
			return selectDbSubCollectionAsync(function(dbRepo) {
				return dbRepo.playlists;
			});
		}

		this.getMediasRepositoryAsync = function () {
			return selectDbSubCollectionAsync(function(dbRepo) {
				return dbRepo.medias;
			});
		}

		this.getBookmarksRepositoryAsync = function () {
			return selectDbSubCollectionAsync(function(dbRepo) {
				return dbRepo.bookmarks;
			});
		}

		this.getFavoritesRepositoryAsync = function () {
			return selectDbSubCollectionAsync(function(dbRepo) {
				return dbRepo.favorites;
			});
		}

		this.getConfigurationRepositoryAsync = function () {
			return selectDbSubCollectionAsync(function(dbRepo) {
				return dbRepo.configuration;
			});
		}

		function selectDbSubCollectionAsync(selector) {
			return ensureDbClientAsync()
				.then(function (dbRepo) {
					return selector(dbRepo);
				});
		}

		function ensureDbClientAsync() {
			if (dbSet) {
				return Q.promise(function (onSuccess, onError) {
					onSuccess(dbSet);
				});
			} else {
				return initDbClientAsync();
			}
		}

		function initDbClientAsync() {
			return Q.promise(function (onSuccess, onError) {
				mongodb.MongoClient.connect(mongoUrl, function (err, db) {
					if (!err) {
						onSuccess(buildDbContext(db));
					} else {
						onError(err);
					}
				});
			});
		}

		function buildDbContext(db) {
			dbSet = {
				db: db,
				playlists: db.collection("playlists")
			};
			return dbSet;
		}
	}

	return SaveService;
})();

module.exports = SaveService;