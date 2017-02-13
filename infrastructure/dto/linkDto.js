'use strict';

var LinkDto = function(data) {
	this.rel = data.rel;
	this.href = data.href;
};

LinkDto.prototype.setRel = function(rel) {
	return new LinkDto(rel, this.href);
};

LinkDto.prototype.setHref = function(href) {
	return new LinkDto(this.rel, href);
};

module.exports = LinkDto;
