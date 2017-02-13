'use strict';

var Q = require('q'),
	Dto = require('./dto');

function safeOptions(options) {
  if (!options) return {};
  return options;
}

function assertValidData(data, options) {
  if (data === undefined) {
    throw new Error('Invalid Bookmark');
  }
}

var BookmarkDto = function(data, overrideId) {
  this.id = overrideId || data.id;
  if ('name' in data) this.name = data.name;
  if ('index' in data) this.index = data.index;
  if ('filePath' in data) this.filePath = data.filePath;
  if ('createdOn' in data) this.createdOn = data.createdOn;
  if ('folderPath' in data) this.folderPath = data.folderPath;
};

BookmarkDto.prototype = Object.create(Dto.prototype);
BookmarkDto.prototype.constructor = Dto;

BookmarkDto.prototype.getDefinedFields = function() {
  var fields = Dto.prototype.getDefinedFields.call(this);
  return fields;
};

BookmarkDto.toDto = function (data, options) {
  options = safeOptions(options);
  assertValidData(data, options);
  return new BookmarkDto(data, options.overrideId);
};

module.exports = BookmarkDto;
