'use strict';

var Q = require('q'),
	Dto = require('./dto');

var assertDefinedObj = function(obj) {
	if (obj === undefined) {
		throw 'Invalid Entity';
	}
};

var UserDto = function (id, username, fullName, email, password, isAdmin, canWrite) {
	this.id = id;
	this.username = username;
	this.fullName = fullName;
	this.email = email;
	this.password = password;
	this.isAdmin = isAdmin;
	this.canWrite = canWrite;
};

UserDto.prototype = Object.create(Dto.prototype);
UserDto.prototype.constructor = Dto;

UserDto.toDto = function (obj, userId) {
	assertDefinedObj(obj); // TODO Should check for types/size

	return new UserDto(
		userId || obj.id,
		obj.username,
		obj.fullName,
		obj.email,
		obj.password,
		obj.isAdmin,
		obj.canWrite
	);
};

module.exports = UserDto;