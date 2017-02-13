'use strict';

var ResourceLinksDto = require('./resourceLinksDto');

var FolderContentDto = function(/*name, type, isRoot, *//*links*/resourceLinksDto, files) {
	if (resourceLinksDto) {
		var v = resourceLinksDto instanceof ResourceLinksDto;
		var v2 = resourceLinksDto instanceof Array;
		if (v) {
			this.links = resourceLinksDto.links;
		} else if (v2){
			this.links = resourceLinksDto;
		} else {
			throw 'links must be an Array';
		}

	}
	//links && assert.equal(links instanceof ResourceLinksDto, true, 'links must be an Array');

	this.files = files;
};

FolderContentDto.prototype = {

	setFiles: function(files) {
		return new FolderContentDto(this.links, files);
	},

	setLinks: function(links) {
		return new FolderContentDto(links, this.files);
	}//,

	//toJson: function() {
	//	return { links: this.links.toJson(), files: this.files };
	//}

};

module.exports = FolderContentDto;