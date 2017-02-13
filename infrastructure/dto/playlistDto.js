'use strict';

var Q = require('q'),
	Dto = require('./dto');

var assertDefinedObj = function(obj) {
	if (obj === undefined) {
		throw 'Invalid Playlist';
	}
	if (obj.id === undefined &&
		obj.name === undefined &&
		obj.index === undefined &&
		obj.filePath === undefined &&
		obj.createdOn === undefined &&
		obj.updatedOn === undefined &&
		obj.isAvailable === undefined &&
		obj.media === undefined) {
		throw 'No playlist object sent';
	}
};

var PlaylistDto = function(id, name, index, filePath, createdOn, updatedOn, isAvailable, media) {
	this.id = id;
	this.name = name;
	this.createdOn = createdOn;
	this.updatedOn = updatedOn;
	this.index = index;
	this.filePath = filePath; // TODO Really necessary to send a path the client won't use ?
	this.isAvailable = isAvailable;
	this.media = media;
};

PlaylistDto.prototype = Object.create(Dto.prototype);
PlaylistDto.prototype.constructor = Dto;

PlaylistDto.prototype.isVirtual = function() {
	return !this.filePath || this.filePath == null;
};

PlaylistDto.prototype.getDefinedFields = function() {
	var fields = Dto.prototype.getDefinedFields.call(this);
	// media in playlistDto will cause error on save, so remove it
	delete fields['media'];
	return fields;
};

PlaylistDto.toDto = function (obj, playlistId) {
	assertDefinedObj(obj); // TODO Should check for types
// TODO Should throw an error if no any property set
	return new PlaylistDto(
		playlistId || obj.id,
		obj.name,
		obj.index,
		obj.filePath, // TODO When i create a new phys. pl, POST send Dto with filePath
		obj.createdOn,
		obj.updatedOn,
		obj.isAvailable,
		obj.media
	);
};

module.exports = PlaylistDto;