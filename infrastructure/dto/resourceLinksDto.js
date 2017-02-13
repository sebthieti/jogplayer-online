'use strict';

var assert = require('assert');

var ResourceLinksDto = function(links) {
	links && assert.equal(links instanceof Array, true, 'links must be an Array');
	//if (links) {
	//	var v = links instanceof ResourceLinksDto;
	//	if (!v) {
	//		throw 'links must be an Array';
	//	}
	//}
	this.links = links;
	//this.concat(links);
};
//ResourceLinksDto.prototype = new Array;

//ResourceLinksDto.prototype.setLink = function(links) {
//	return new ResourceLinksDto(links);
//};

//ResourceLinksDto.prototype.addLink = function(link) {
//	if (!link) return this;
//
//	//var safeLinks = this.links || [];
//	//safeLinks.push(link);
//	this.push(link);
//
//	return new ResourceLinksDto(this);
//};

//ResourceLinksDto.prototype.toJson = function() {
//	return
//};
ResourceLinksDto.prototype = {

	//setLink: function(links) {
	//	return new ResourceLinksDto(links);
	//},

	addLink: function(link) {
		if (!link) return this;

		var safeLinks = this.links || [];
		safeLinks.push(link);

		return new ResourceLinksDto(safeLinks);
	}//,

	//toJson: function() {
	//	return this.links;
	//}

};

module.exports = ResourceLinksDto;