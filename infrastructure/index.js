'use strict';

var os = require('os'),
	dependable = require('dependable'),
	from = require('fromjs'),
	container = dependable.container(),
	BUSINESS = require("./business"),
	INVOKERS = require("./invokers"),
	SERVICES = require("./services"),
	REPOSITORIES = require("./repositories"),
	CONTROLLERS = require("./controllers"),
	STREAM = require("./stream");

// Composite root principle
var registerControllers = function (app, io) {
	container.register("homeController", new CONTROLLERS.HomeController(app));
	container.register("mediaController", function (mediaStreamer) {
		return new CONTROLLERS.MediaController(app, mediaStreamer);
	});
	container.register("playlistController", function (playlistDirector, playlistsDirector) {
		return new CONTROLLERS.PlaylistController(app, playlistDirector, playlistsDirector);
	});
	container.register("fileExplorerController", function (mediaStreamer, fileExplorerRepository) {
		return new CONTROLLERS.FileExplorerController(app, mediaStreamer, fileExplorerRepository);
	});
	container.register("favoriteController", function (favoriteDirector) {
		return new CONTROLLERS.FavoriteController (app, favoriteDirector)
	});
};

var registerBusinesses = function () {
	container.register("mediaDirector", function (mediaService, mediaSaveService) {
		return new BUSINESS.MediaDirector(mediaService, mediaSaveService);
	});
	container.register("playlistDirector", function (mediaDirector, physicalPlaylistServices, playlistSaveService, mediaSaveService, mediaService, mediaBuilder) {
		return new BUSINESS.PlaylistDirector(mediaDirector, physicalPlaylistServices, playlistSaveService, mediaSaveService, mediaService, mediaBuilder);
	});
	container.register("playlistsDirector", function (playlistDirector, playlistSaveService) {
		return new BUSINESS.PlaylistsDirector(playlistDirector, playlistSaveService);
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

var registerServices = function () {
	container.register("mediaService", new SERVICES.MediaService());
	container.register("saveService", new SERVICES.SAVES.SaveService());
	container.register("metaTagServices", [ new SERVICES.MetaTagId3v1Service() ]);
	container.register("physicalPlaylistServices", function (mediaBuilder) {
		return [ new SERVICES.M3uPlaylistService(mediaBuilder) ];
	});
	container.register("mediaSaveService", function (saveService, mediaBuilder) {
		return new SERVICES.SAVES.MediaSaveService(saveService, mediaBuilder);
	});
	container.register("playlistSaveService", function (saveService, mediaSaveService) {
		return new SERVICES.SAVES.PlaylistSaveService(saveService, mediaSaveService);
	});
	container.register("favoriteSaveService", function (saveService) {
		return new SERVICES.SAVES.FavoriteSaveService(saveService);
	});
};

var registerOther = function() {
	container.register("mediaBuilder", function (metaTagServices, mediaService) {
		return new INVOKERS.MediaBuilder(metaTagServices, mediaService);
		//MediaBuilder (metaTagServices, mediaService
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

var resolve = function() {
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
	registerOther();

	resolve();
};