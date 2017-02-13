'use strict';

var Q = require('q'),
	invokers = require('../invokers'),
	Dto = require('./dto');

var BookmarkDto = function(id, name, index, filePath, createdOn, folderPath) {
	this.id = id;
	this.name = name;
	this.createdOn = createdOn;
	this.index = index;
	this.folderPath = folderPath;
};
BookmarkDto.prototype = Object.create(Dto.prototype);
BookmarkDto.prototype.constructor = Dto;

//BookmarkDto.toDto = function (obj, favId) {
//	return invokers.dtoBuilder.validateAndBuildBookmarkDtoFromObject(obj, favId);
//};

module.exports = BookmarkDto;