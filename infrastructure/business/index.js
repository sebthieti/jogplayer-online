var MediaDirector = require("./mediaDirector"),
	PlaylistDirector = require("./playlistDirector"),
	PlaylistsDirector = require("./playlistsDirector"),
	FileExplorerDirector = require("./fileExplorerDirector"),
	FavoriteDirector = require("./favoriteDirector");

(function (exports) {
	"use strict";

	exports.BUSINESS = {
		 FileExplorerDirector: FileExplorerDirector,
		 MediaDirector: MediaDirector,
		 PlaylistDirector: PlaylistDirector,
		 PlaylistsDirector: PlaylistsDirector,
		 FavoriteDirector: FavoriteDirector
	 }

}(module.exports));