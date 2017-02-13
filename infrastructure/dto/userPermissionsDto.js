'use strict';

var Q = require('q'),
	Dto = require('./dto');

var assertDefinedObj = function(obj) {
	if (obj === undefined) {
		throw 'Invalid Entity';
	}
};

function UserPermissionsDto(isAdmin, canWrite, allowPaths, denyPaths, homePath) {
	if (isAdmin !== undefined) {
		this.isAdmin = isAdmin;
	}
	if (canWrite !== undefined) {
		this.canWrite = canWrite;
	}
	if (allowPaths !== undefined) {
		this.allowPaths = allowPaths;
	}
	if (denyPaths !== undefined) {
		this.denyPaths = denyPaths;
	}
	if (homePath !== undefined) {
		this.homePath = homePath;
	}
}

UserPermissionsDto.prototype = Object.create(Dto.prototype);
UserPermissionsDto.prototype.constructor = Dto;

UserPermissionsDto.toDto = function (obj) {
	assertDefinedObj(obj); // TODO Should check for types/size

	return new UserPermissionsDto(
		obj.isAdmin,
		obj.canWrite,
		obj.allowPaths,
		obj.denyPaths,
		obj.homePath
	);
};

module.exports = UserPermissionsDto;