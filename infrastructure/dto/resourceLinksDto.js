'use strict';

var Dto = require('./dto');

function assertValidData(data) {
  if (data === undefined) {
    throw new Error('No data has been provided for resourceLinks');
  }

  if (data.links && !(links instanceof Array)) {
    throw new Error('links must be an Array');
  }
}

var ResourceLinksDto = function(data) {
  if (!data) return;
  if (data.links) this.links = data.links;
};

ResourceLinksDto.prototype = Object.create(Dto.prototype);
ResourceLinksDto.prototype.constructor = Dto;
ResourceLinksDto.prototype.addLink = function(link) {
  if (!link) return this;

  var safeLinks = this.links || [];
  safeLinks.push(link);

  return new ResourceLinksDto({ links: safeLinks });
};

ResourceLinksDto.toDto = function (data) {
  assertValidData(data);
  return new ResourceLinksDto(data);
};

module.exports = ResourceLinksDto;
