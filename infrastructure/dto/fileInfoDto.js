'use strict';

var FileInfoDto = function(data) {
	if ('name' in data) this.name = data.name;
	if ('type' in data) this.type = data.type;
	if (data.resourcesLinksDto && data.resourcesLinksDto.links) {
    this.links = data.resourcesLinksDto.links;
  }
	// filePath ?
};

module.exports = FileInfoDto;
