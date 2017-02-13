'use strict';

// Modules
var os = require('os'),
	process = require('process'),
	path = require('path'),
	dependable = require('dependable'),
	container = dependable.container(),
	from = require('fromjs'),
	passport = require('passport'),
	LocalStategy = require('passport-local').Strategy;

// Infrastructure modules
var routes = require('./routes'),
	Business = require('./business'),
	Invokers = require('./invokers'),
	Services = require('./services'),
	Proxies = require('./proxies'),
	Controllers = require('./controllers'),
	Stream = require('./stream'),
	Models = require('./models'),
	Utils = require('./utils');

// Composite root principle
function registerControllers(app, io) {
	container.register('playMediaController', function (mediaStreamer, routes, authDirector, mediaDirector) {
		return new Controllers.PlayMediaController(app, routes.media, routes.file, mediaStreamer, authDirector, mediaDirector);
	});
	container.register('playlistController', function (routes, playlistDirector, playlistsDirector, authDirector) {
		return new Controllers.PlaylistController(app, routes.playlists, routes.media, playlistDirector, playlistsDirector, authDirector);
	});
	container.register('fileExplorerController', function (mediaStreamer, fileExplorerDirector, authDirector) {
		return new Controllers.FileExplorerController(app, mediaStreamer, fileExplorerDirector, authDirector);
	});
	container.register('favoriteController', function (routes, favoriteDirector, authDirector) {
		return new Controllers.FavoriteController (app, routes, favoriteDirector, authDirector)
	});
	container.register('stateController', function (routes, authDirector) {
		return new Controllers.StateController (app, routes, authDirector)
	});
	container.register('authController', function (routes, authDirector) {
		return new Controllers.AuthController (app, routes, passport, authDirector)
	});
	container.register('userController', function (routes, authDirector, userDirector) {
		return new Controllers.UserController (app, routes, authDirector, userDirector)
	});
	container.register('userStateController', function (routes, authDirector, userStateDirector) {
		return new Controllers.UserStateController (app, routes, authDirector, userStateDirector)
	});
}

function registerBusinesses() {
	container.register('mediaDirector', function (mediaService, mediaSaveService, fileExplorerService) {
		return new Business.MediaDirector(mediaService, mediaSaveService, fileExplorerService);
	});
	container.register('authDirector', function (userProxy) {
		return new Business.AuthDirector (userProxy);
	});
	container.register('playlistDirector', function (fileExplorerService, mediaDirector, physicalPlaylistServices, playlistSaveService, playlistProxy, playlistsProxy, mediaSaveService, mediaService, mediaBuilder) {
		return new Business.PlaylistDirector(fileExplorerService, mediaDirector, physicalPlaylistServices, playlistSaveService, playlistProxy, playlistsProxy, mediaSaveService, mediaService, mediaBuilder);
	});
	container.register('playlistsDirector', function (playlistsProxy, playlistDirector, physicalPlaylistServices, playlistSaveService, playlistBuilder) {
		return new Business.PlaylistsDirector(playlistsProxy, playlistDirector, physicalPlaylistServices, playlistSaveService, playlistBuilder);
	});
	container.register('fileExplorerDirector', function (fileExplorerService) {
		return new Business.FileExplorerDirector(fileExplorerService);
	});
	container.register('favoriteDirector', function (favoriteProxy) {
		return new Business.FavoriteDirector (favoriteProxy);
	});
	container.register('userDirector', function (userPermissionsDirector, userProxy) {
		return new Business.UserDirector (userPermissionsDirector, userProxy);
	});
	container.register('userStateDirector', function (userStateProxy) {
		return new Business.UserStateDirector (userStateProxy);
	});
	container.register('userPermissionsDirector', function (userSaveService, Models) {
		return new Business.UserPermissionsDirector (userSaveService, Models.UserPermissions);
	});
}

function registerPaths() {
	container.register('routes', routes);
}

function registerModels() {
	container.register('Models', function(routes) {
		return {
			Favorite: Models.Favorite(routes.favorites),
			Bookmark: Models.Bookmark,
			Media: Models.Media(routes.media),
			MediaType: Models.MediaType,
			Playlist: Models.Playlist(routes.playlists, routes.media),
			User: Models.User(routes.users),
			UserState: Models.UserState(routes.userStates),
			UserPermissions: Models.UserPermissions(routes)
		}
	});
}

function registerProxies() {
	container.register('userProxy', function(userSaveService) {
		return new Proxies.UserProxy(userSaveService);
	});
	container.register('favoriteProxy', function(favoriteSaveService) {
		return new Proxies.FavoriteProxy(favoriteSaveService);
	});
	container.register('playlistProxy', function(playlistSaveService) {
		return new Proxies.PlaylistProxy(playlistSaveService);
	});
	container.register('playlistsProxy', function(playlistSaveService) {
		return new Proxies.PlaylistsProxy(playlistSaveService);
	});
	container.register('playlistProxyMediator', function(playlistProxy, playlistsProxy) {
		return new Proxies.PlaylistProxyMediator(playlistProxy, playlistsProxy);
	});
	container.register('userStateProxy', function(userStateSaveService) {
		return new Proxies.UserStateProxy(userStateSaveService);
	});
}

function registerServices() {
	container.register('mediaService', Services.mediaService);
	container.register('saveService', function(configService) {
		return new Services.Saves.SaveService(configService.observeConfigFile());
	});
	container.register('metaTagServices', [ new Services.MetaTagId3v1Service() ]);
	container.register('physicalPlaylistServices', function (mediaBuilder, fileExplorerService, pathBuilder) {
		return [ new Services.M3uPlaylistService(mediaBuilder, fileExplorerService, pathBuilder) ];
	});
	container.register('mediaSaveService', function (saveService, mediaBuilder, Models) {
		return new Services.Saves.MediaSaveService(saveService, mediaBuilder, Models.Media, Models.Playlist);
	});
	container.register('playlistSaveService', function (saveService, mediaSaveService, Models) {
		return new Services.Saves.PlaylistSaveService(saveService, mediaSaveService, Models.Playlist);
	});
	container.register('favoriteSaveService', function (saveService, Models) {
		return new Services.Saves.FavoriteSaveService(saveService, Models.Favorite);
	});
	container.register('userSaveService', function (saveService, Models) {
		return new Services.Saves.UserSaveService(saveService, Models.User);
	});
	container.register('userStateSaveService', function (saveService, Models) {
		return new Services.Saves.UserStateSaveService(saveService, Models.UserState);
	});
	container.register('userPermissionsSaveService', function (saveService, Models) {
		return new Services.Saves.UserPermissionsSaveService(saveService, Models.UserPermissions);
	});
	container.register('fileExplorerService', function () {// anyDriveLetterRegex
		var fileExplorerServices = [
			new Services.FileExplorers.WinFileExplorerService(),// anyDriveLetterRegex
			new Services.FileExplorers.DarwinFileExplorerService(),
			new Services.FileExplorers.LinuxFileExplorerService()
		];
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
}

function registerAuthenticationStack(app) {
	// Must be executed before any http request
	container.resolve(function(authDirector) {
		passport.use(new LocalStategy(authDirector.verifyUser));
		passport.serializeUser(function(user, next) {
			authDirector.serializeUser(user, next);
		});
		passport.deserializeUser(function(username, next) {
			authDirector.deserializeUser(username, next);
		});

		app.use(passport.initialize());
		app.use(passport.session());
	});
}

function registerOther() {
	container.register('mediaBuilder', function (metaTagServices, mediaService, Models) {
		return new Invokers.MediaBuilder(metaTagServices, mediaService, Models.Media);
	});

	container.register('playlistBuilder', function (Models, fileExplorerService) {
		return new Invokers.PlaylistBuilder(Models.Playlist, fileExplorerService);
	});

	container.register('pathBuilder', function (fileExplorerService) {
		return new Utils.PathBuilder(fileExplorerService);
	});

	container.register('mediaStreamer', function (mediaDirector, fileExplorerService) {
		return new Stream.MediaStreamer(mediaDirector, fileExplorerService);
	});
}

function registerHome(app) {
	container.register('homeController', function(routes, configDirector) {
		return new Controllers.HomeController(app, configDirector, routes);
	});
}

function bootstrap(app, io) {
	registerPaths();
	registerSetupStack(app);
	registerHome(app);

	registerOther();
	registerModels();
	registerServices();
	registerProxies();
	registerBusinesses();
	registerControllers(app, io);
	registerAuthenticationStack(app);

	container.resolve(function(
		setupController,
		homeController,
	    playMediaController,
		playlistController,
		fileExplorerController,
		favoriteController,
		stateController,
		authController,
		userController,
		userStateController,
		playlistProxyMediator
	) {
		homeController.init();
		setupController.init();

		playMediaController.init();
		playlistController.init();
		fileExplorerController.init();
		favoriteController.init();
		stateController.init();
		authController.init();
		userController.init();
		userStateController.init();

		playlistProxyMediator.init();
	});
}

function registerSetupStack(app) {
	container.register('setupController', function (configDirector, routes) {
		return new Controllers.SetupController(app, configDirector, routes);
	});
	container.register('configDirector', function (configService, userDirector, configSaveService) {
		return new Business.ConfigDirector(configService, userDirector, configSaveService);
	});
	container.register('configService', function() {
		return new Services.ConfigService();
	});
	container.register('configSaveService', function () {
		return new Services.Saves.ConfigSaveService();
	});
}

function checkRequiredEnvVar() {
	if (!('FFMPEG_PATH' in process.env)) {
		// To ensure fluent-ffmpeg will work well
		process.env.FFMPEG_PATH = path.join(process.cwd(), getFFMpegRelativePath());
	}
	if (!('FFPROBE_PATH' in process.env)) {
		// To ensure fluent-ffmpeg will work well with ffprobe
		process.env.FFPROBE_PATH = path.join(process.cwd(), getFFProbeRelativePath());
	}
}

function getFFMpegRelativePath() {
	return os.platform() === "win32"
		? "./ffmpeg/ffmpeg.exe"
		: "./ffmpeg/ffmpeg";
}

function getFFProbeRelativePath() {
	return os.platform() === "win32"
		? "./ffmpeg/ffprobe.exe"
		: "./ffmpeg/ffprobe";
}

exports.init = function (app, io) {
	//process.env.FFMPEG_PATH
	// TODO Move ffmpeg/ffprobe to dedicated folder
	checkRequiredEnvVar();
	bootstrap(app, io);
};