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
	if (id !== undefined) {
		this.id = id;
	}
	if (isActive !== undefined) {
		this.isActive = isActive;
	}
	if (username !== undefined) {
		this.username = username;
	}
	if (fullName !== undefined) {
		this.fullName = fullName;
	}
	if (email !== undefined) {
		this.email = email;
	}
	if (password !== undefined) {
		this.password = password;
	}
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
		obj.permissions ? obj.permissions.isAdmin : undefined,
		obj.permissions ? obj.permissions.canWrite : undefined,
		obj.permissions ? obj.permissions.allowPaths : undefined,
		obj.permissions ? obj.permissions.denyPaths : undefined,
		obj.permissions ? obj.permissions.homePath : undefined
	);
};

module.exports = UserDto;