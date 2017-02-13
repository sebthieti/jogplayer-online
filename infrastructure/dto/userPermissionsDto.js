'use strict';

var Q = require('q'),
	Dto = require('./dto');

var assertDefinedObj = function(obj) {
	if (obj === undefined) {
		throw 'Invalid Entity';
	}
};

function UserPermissionsDto(isAdmin, canWrite, allowPaths, denyPaths, homePath) {
	this.isAdmin = isAdmin;
	this.canWrite = canWrite;
	this.allowPaths = allowPaths;
	this.denyPaths = denyPaths;
	this.homePath = homePath;
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