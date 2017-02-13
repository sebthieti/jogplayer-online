'use strict';

var FileInfoDto = function(data) {
	if (data.name) this.name = data.name;
	if (data.type) this.type = data.type;
	if (data.resourcesLinksDto && data.resourcesLinksDto.links) {
    this.links = data.resourcesLinksDto.links;
  }
	// filePath ?
};

module.exports = FileInfoDto;
