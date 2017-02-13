'use strict';

var FileInfo = function(filePath, name, type, isRoot, resourceLinksDto) { /*links*/
	this.name = name;
	this.type = type;
	this.isRoot = isRoot;
	this.filePath = filePath;
	//this.links = resourceLinksDto.links;
	// filePath ?
};

FileInfo.prototype = {

	//setFiles: function(files) {
	//	return new FileDto(this.name, this.type, this.isRoot, this.links, files);
	//},

	//setLinks: function(links) {
	//	return new FileInfoDto(this.name, this.type, links);
	//}

	getName: function() {
		return this.name;
	},

	isDirectory: function() {
		return this.type === FileInfo.directory;
	},

	isFile: function() {
		return this.type === FileInfo.file;
	},

	isValid: function() {
		return this.name != null
			&& this.type != null
			&& this.isRoot != null;
	}

};

FileInfo.directory = 'D';
FileInfo.file = 'F';
FileInfo.invalid = new FileInfo(null, null, null, null, null);

module.exports = FileInfo;