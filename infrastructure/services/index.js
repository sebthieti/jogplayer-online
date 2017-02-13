var FILEEXPLORERS = require("./fileExplorers").FILEEXPLORERS,
	SAVES = require("./saves").SAVES,
	M3uPlaylistService = require("./m3uPlaylistService"),
	MediaService = require("./mediaService"),
	MetaTagId3v1Service = require("./metaTagId3v1Service");

(function (exports) {
	"use strict";

	exports.SERVICES = {
		SAVES: SAVES,
		FILEEXPLORERS: FILEEXPLORERS,
		M3uPlaylistService: M3uPlaylistService,
		MediaService: MediaService,
		MetaTagId3v1Service: MetaTagId3v1Service
	}

}(module.exports));