'use strict';

var Q = require('q'),
	Dto = require('./dto');

function assertValidData(data) {
	if (data === undefined) {
		throw new Error('No data has been provided for userPermissions');
	}

  if (data.isAdmin && typeof data.isAdmin !== 'boolean') {
    throw new Error('isAdmin must be of type Boolean');
  }
  if (data.canWrite && typeof data.canWrite !== 'boolean') {
    throw new Error('canWrite must be of type Boolean');
  }
  if (data.allowPaths && !(data.allowPaths instanceof Array)) {
    throw new Error('allowPaths must be of type Array');
  }
  if (data.denyPaths && !(data.denyPaths instanceof Array)) {
    throw new Error('denyPaths must be of type Array');
  }
  if (data.homePath && typeof data.homePath !== 'string') {
    throw new Error('homePath must be specified and of type String');
  }
}

function UserPermissionsDto(data) {
	if (data.isAdmin) this.isAdmin = data.isAdmin;
	if (data.canWrite) this.canWrite = data.canWrite;
	if (data.allowPaths) this.allowPaths = data.allowPaths;
	if (data.denyPaths) this.denyPaths = data.denyPaths;
	if (data.homePath) this.homePath = data.homePath;
}

UserPermissionsDto.prototype = Object.create(Dto.prototype);
UserPermissionsDto.prototype.constructor = Dto;

UserPermissionsDto.toDto = function (data) {
  assertValidData(data);
  return new UserPermissionsDto(data);
};

module.exports = UserPermissionsDto;
