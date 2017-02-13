'use strict';

var LinkDto = function(rel, href) {
	this.rel = rel;
	this.href = href;
};

LinkDto.prototype = {

	setRel: function(rel) {
		return new LinkDto(rel, this.href);
	},

	setHref: function(href) {
		return new LinkDto(this.rel, href);
	}

};

module.exports = LinkDto;