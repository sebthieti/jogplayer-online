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
  if (data.name) this.name = data.name;
  if (data.index) this.index = data.index;
  if (data.filePath) this.filePath = data.filePath;
  if (data.createdOn) this.createdOn = data.createdOn;
  if (data.folderPath) this.folderPath = data.folderPath;
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
