'use strict'

var path = require('path');

var MediaService = require('./infrastructure/services/media-service');
var SaveService = require('./infrastructure/services/save-service');
var MediaSaveService = require('./infrastructure/services/media-save-service');
var PlaylistSaveService = require('./infrastructure/services/playlist-save-service');
var PlaylistDirector = require('./infrastructure/business/playlist-director');
var PlaylistsDirector = require('./infrastructure/business/playlists-director');
var PlaylistBusiness = require('./infrastructure/business/playlist-business');
var PlaylistsBusiness = require('./infrastructure/business/playlists-business');
var M3UPlaylistService = require('./infrastructure/services/m3u-playlist-service');
var MediaBuilder = require('./infrastructure/invokers/media-builder');
var MetaTagId3V1Service = require('./infrastructure/services/meta-tag-id3v1-service');

// TODO Have a module.js to composite root
var mediaService = new MediaService();
var metaTagId3V1Service = new MetaTagId3V1Service();
var metaTagServices = [ metaTagId3V1Service ];
var mediaBuilder = new MediaBuilder(metaTagServices);
var m3uPlaylistService = new M3UPlaylistService(mediaBuilder);
var physicalPlaylistServices = [ m3uPlaylistService ];
var saveService = new SaveService();
var mediaSaveService = new MediaSaveService(saveService, mediaBuilder);
var playlistSaveService = new PlaylistSaveService(saveService);
var playlistDirector = new PlaylistDirector(physicalPlaylistServices, playlistSaveService, mediaSaveService, mediaService, mediaBuilder);
var playlistsDirector = new PlaylistsDirector(playlistDirector, playlistSaveService);
var playlistBusiness = new PlaylistBusiness(playlistDirector);
var playlistsBusiness = new PlaylistsBusiness(playlistsDirector);

var http = require('http');
var express = require('express');
var controllers = require('./controllers');

var app = express();

app.set('view engine', 'vash');

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')))

controllers.init(app, playlistsBusiness);

http.createServer(app)
	.listen(10000);