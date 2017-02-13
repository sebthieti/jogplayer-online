var SaveService = require("./saveService"),
	PlaylistSaveService = require("./playlistSaveService"),
	MediaSaveService = require("./mediaSaveService"),
	FavoriteSaveService = require("./favoriteSaveService");

 (function (exports) {
	"use strict";

	 exports.SAVES = {
		 SaveService: SaveService,
		 PlaylistSaveService: PlaylistSaveService,
		 MediaSaveService: MediaSaveService,
		 FavoriteSaveService: FavoriteSaveService
	 }

}(module.exports));