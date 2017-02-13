var HomeController = require("./homeController"),
	PlaylistController = require("./playlistController"),
	MediaController = require("./mediaController"),
	FileExplorerController = require("./fileExplorerController"),
	FavoriteController = require("./favoriteController");

 (function(exports) {
	'use strict';

	 exports.CONTROLLERS = {
		 HomeController: HomeController,
		 PlaylistController: PlaylistController,
		 MediaController: MediaController,
		 FileExplorerController: FileExplorerController,
		 FavoriteController: FavoriteController
	 }

})(module.exports);