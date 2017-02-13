'use strict';

var Q = require('q'),
	Dto = require('./dto');

var assertDefinedObj = function(obj) {
	if (obj === undefined) {
		throw 'Invalid Entity';
	}
};

function UserPermissionsDto(userId, allowedPaths) {
	this.userId = userId;
	this.allowedPaths = allowedPaths;
}

UserPermissionsDto.prototype = Object.create(Dto.prototype);
UserPermissionsDto.prototype.constructor = Dto;

UserPermissionsDto.toDto = function (obj, userId) {
	assertDefinedObj(obj); // TODO Should check for types/size

	return new UserPermissionsDto(
		userId || obj.userId,
		obj.allowedPaths
	);
};

module.exports = UserPermissionsDto;