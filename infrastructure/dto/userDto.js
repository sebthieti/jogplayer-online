'use strict';

var Q = require('q'),
	Dto = require('./dto'),
	UserPermissionsDto = require('./userPermissionsDto');

var assertDefinedObj = function(obj) {
	if (obj === undefined) {
		throw 'Invalid Entity';
	}
};

var UserDto = function (id, isActive, username, fullName, email, password, isAdmin, canWrite, allowPaths, denyPaths, homePath) {
	this.id = id;
	this.isActive = isActive;
	this.username = username;
	this.fullName = fullName;
	this.email = email;
	this.password = password;

	this.permissions = new UserPermissionsDto(isAdmin, canWrite, allowPaths, denyPaths, homePath);
};

UserDto.prototype = Object.create(Dto.prototype);
UserDto.prototype.constructor = Dto;

UserDto.toDto = function (obj, userId) {
	assertDefinedObj(obj); // TODO Should check for types/size

	return new UserDto(
		userId || obj.id,
		obj.isActive,
		obj.username,
		obj.fullName,
		obj.email,
		obj.password,
		obj.permissions.isAdmin,
		obj.permissions.canWrite,
		obj.permissions.allowPaths,
		obj.permissions.denyPaths,
		obj.permissions.homePath
	);
};

module.exports = UserDto;