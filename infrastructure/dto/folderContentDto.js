'use strict';

var ResourceLinksDto = require('./resourceLinksDto');

var FolderContentDto = function(data) {
	if (!data) return;

  if (data.resourceLinksDto) {
		var isDto = data.resourceLinksDto instanceof ResourceLinksDto;
		var isArray = data.resourceLinksDto instanceof Array;
		if (isDto) {
			this.links = data.resourceLinksDto.links;
		} else if (isArray){
			this.links = data.resourceLinksDto;
		} else {
			throw new Error('links must be an Array');
		}
	}

	if (data.files) this.files = data.files;
};

FolderContentDto.prototype.setFiles = function(files) {
  return new FolderContentDto({ resourceLinksDto: this.links, files: files });
};

FolderContentDto.prototype.setLinks = function(links) {
  return new FolderContentDto({ resourceLinksDto: links, files: this.files });
};

module.exports = FolderContentDto;
