'use strict';

var os = require('os'),
	dependable = require('dependable'),
	config = require('config'),
	from = require('fromjs'),
	container = dependable.container(),
	routes = require('./routes'),
	BUSINESS = require("./business"),
	INVOKERS = require("./invokers"),
	SERVICES = require("./services"),
	REPOSITORIES = require("./repositories"),
	CONTROLLERS = require("./controllers"),
	STREAM = require("./stream"),
	Models = require("./models");

// Composite root principle
var registerControllers = function (app, io) {
	container.register("homeController", function(routes) {
		return new CONTROLLERS.HomeController(app, routes);
	});
	container.register("mediaController", function (mediaStreamer, routes) {
		return new CONTROLLERS.MediaController(app, routes.media, routes.file, mediaStreamer);
	});
	container.register("playlistController", function (routes, playlistDirector, playlistsDirector) {
		return new CONTROLLERS.PlaylistController(app, routes.playlists, routes.media, playlistDirector, playlistsDirector);
	});
	container.register("fileExplorerController", function (mediaStreamer, fileExplorerRepository) {
		return new CONTROLLERS.FileExplorerController(app, mediaStreamer, fileExplorerRepository);
	});
	container.register("favoriteController", function (routes, favoriteDirector) {
		return new CONTROLLERS.FavoriteController (app, routes, favoriteDirector)
	});
};

var registerBusinesses = function () {
	container.register("mediaDirector", function (mediaService, mediaSaveService) {
		return new BUSINESS.MediaDirector(mediaService, mediaSaveService);
	});
	container.register("playlistDirector", function (fileExplorer, mediaDirector, physicalPlaylistServices, playlistSaveService, mediaSaveService, mediaService, mediaBuilder) {
		return new BUSINESS.PlaylistDirector(fileExplorer, mediaDirector, physicalPlaylistServices, playlistSaveService, mediaSaveService, mediaService, mediaBuilder);
	});
	container.register("playlistsDirector", function (playlistDirector, physicalPlaylistServices, playlistSaveService, playlistBuilder) {
		return new BUSINESS.PlaylistsDirector(playlistDirector, physicalPlaylistServices, playlistSaveService, playlistBuilder);
	});
	container.register("fileExplorerDirector", function (fileExplorer) {
		return new BUSINESS.FileExplorerDirector(fileExplorer);
	});
	container.register("favoriteDirector", function (favoriteSaveService) {
		return new BUSINESS.FavoriteDirector (favoriteSaveService);
	});
	container.register("fileExplorerRepository", function (fileExplorerDirector) { // TODO Repository strategy
		return new REPOSITORIES.FileExplorerRepository(fileExplorerDirector);
	});
};

var registerConfigAndPaths = function() {
	container.register("config", config);
	container.register("routes", routes);
};

var registerModels = function() {
	container.register('Models', function(routes) {
		return {
			Favorite: Models.Favorite(routes.favorites),
			Bookmark: Models.Bookmark,
			Media: Models.Media(routes.media),
			MediaType: Models.MediaType,
			Playlist: Models.Playlist(routes.playlists, routes.media)
		}
	});
};

var registerServices = function () {
	container.register("mediaService", SERVICES.mediaService);
	container.register("saveService", function(config) {
		return new SERVICES.SAVES.SaveService(config);
	});
	container.register("metaTagServices", [ new SERVICES.MetaTagId3v1Service() ]);
	container.register("physicalPlaylistServices", function (mediaBuilder) {
		return [ new SERVICES.M3uPlaylistService(mediaBuilder) ];
	});
	container.register("mediaSaveService", function (saveService, mediaBuilder, Models) {
		return new SERVICES.SAVES.MediaSaveService(saveService, mediaBuilder, Models.Media, Models.Playlist);
	});
	container.register("playlistSaveService", function (saveService, mediaSaveService, Models) {
		return new SERVICES.SAVES.PlaylistSaveService(saveService, mediaSaveService, Models.Playlist);
	});
	container.register("favoriteSaveService", function (saveService, Models) {
		return new SERVICES.SAVES.FavoriteSaveService(saveService, Models.Favorite);
	});
};

var registerOther = function() {
	container.register("mediaBuilder", function (metaTagServices, mediaService, Models) {
		return new INVOKERS.MediaBuilder(metaTagServices, mediaService, Models.Media);
	});

	container.register("playlistBuilder", function (Models) {
		return new INVOKERS.PlaylistBuilder(Models.Playlist);
	});

	container.register("mediaStreamer", function (mediaDirector, fileExplorer) {
		return new STREAM.MediaStreamer(mediaDirector, fileExplorer);
	});

	container.register("fileExplorer", function () {
		var darwinFileExplorerService = new SERVICES.FILEEXPLORERS.DarwinFileExplorerService();
		var windowsFileExplorerService = new SERVICES.FILEEXPLORERS.WinFileExplorerService();
		var linuxFileExplorer = new SERVICES.FILEEXPLORERS.LinuxFileExplorerService();
		var fileExplorerServices = [ darwinFileExplorerService, windowsFileExplorerService, linuxFileExplorer ];
		var findFileExplorerForCurrentOs = function (fileExplorerServices) {
			var currentOs = os.platform();
			var fileExplorerSvcForCurrentOs;
			for (var index = 0, fileExplorerSvcCnt = fileExplorerServices.length; index < fileExplorerSvcCnt; index++) {
				var fileExplorerSvc = fileExplorerServices[index];
				if (fileExplorerSvc.canHandleOs(currentOs)) {
					fileExplorerSvcForCurrentOs = fileExplorerSvc;
					break;
				}
			}
			return fileExplorerSvcForCurrentOs;
		};
		return findFileExplorerForCurrentOs(fileExplorerServices);
	});
};

var bootstrap = function() {
	container.resolve(function(
		homeController,
		mediaController,
		playlistController,
		fileExplorerController,
		favoriteController
	) {
		homeController.init();
		mediaController.init();
		playlistController.init();
		fileExplorerController.init();
		favoriteController.init();
	});
};

module.exports.init = function (app, io) {
	registerControllers(app, io);
	registerBusinesses();
	registerServices();
	registerModels();
	registerConfigAndPaths();
	registerOther();
	// Must be the last one to initialise
	bootstrap();
};