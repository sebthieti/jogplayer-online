'use strict';

// Modules
var os = require('os'),
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
	container.register('mediaDirector', function (mediaService, mediaSaveService) {
		return new Business.MediaDirector(mediaService, mediaSaveService);
	});
	container.register('authDirector', function (userSaveService) {
		return new Business.AuthDirector (userSaveService);
	});
	container.register('playlistDirector', function (fileExplorerService, mediaDirector, physicalPlaylistServices, playlistSaveService, mediaSaveService, mediaService, mediaBuilder) {
		return new Business.PlaylistDirector(fileExplorerService, mediaDirector, physicalPlaylistServices, playlistSaveService, mediaSaveService, mediaService, mediaBuilder);
	});
	container.register('playlistsDirector', function (playlistDirector, physicalPlaylistServices, playlistSaveService, playlistBuilder) {
		return new Business.PlaylistsDirector(playlistDirector, physicalPlaylistServices, playlistSaveService, playlistBuilder);
	});
	container.register('fileExplorerDirector', function (fileExplorerService) {
		return new Business.FileExplorerDirector(fileExplorerService);
	});
	container.register('favoriteDirector', function (favoriteSaveService) {
		return new Business.FavoriteDirector (favoriteSaveService);
	});
	container.register('userDirector', function (userPermissionsDirector, userSaveService, userPermissionsSaveService) {
		return new Business.UserDirector (userPermissionsDirector, userSaveService, userPermissionsSaveService);
	});
	container.register('userStateDirector', function (userStateSaveService) {
		return new Business.UserStateDirector (userStateSaveService);
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
		userStateController
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

exports.init = function (app, io) {
	// Must be the last one to initialise
	bootstrap(app, io);
};