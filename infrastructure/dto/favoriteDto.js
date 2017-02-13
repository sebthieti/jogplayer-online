'use strict';

var Q = require('q'),
	Dto = require('./dto');

var assertDefinedObj = function(obj) {
	if (obj === undefined) {
		throw 'Invalid Playlist';
	}
};

var FavoriteDto = function (id, name, index, createdOn, folderPath) {
	this.id = id;
	this.name = name;
	this.createdOn = createdOn;
	this.index = index;
	this.folderPath = folderPath;
};

FavoriteDto.prototype = Object.create(Dto.prototype);
FavoriteDto.prototype.constructor = Dto;

FavoriteDto.toDto = function (obj, favId) {
	assertDefinedObj(obj); // TODO Should check for types/size

	return new FavoriteDto(
		favId || obj.id,
		obj.name,
		obj.index,
		obj.createdOn,
		obj.folderPath
	);
};

module.exports = FavoriteDto;