'use strict';

var FileInfoDto = function(name, type, /*links*/resourceLinksDto) {
	this.name = name;
	this.type = type;
	//this.resourceLinksDto = /*links*/resourceLinksDto;
	this.links = resourceLinksDto.links;
	// filePath ?
};

FileInfoDto.prototype = {

	//setFiles: function(files) {
	//	return new FileDto(this.name, this.type, this.isRoot, this.links, files);
	//},

	//setLinks: function(links) {
	//	return new FileInfoDto(this.name, this.type, links);
	//}

};

module.exports = FileInfoDto;