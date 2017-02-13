'use strict';

var Q = require('q'),
	Dto = require('./dto'),
	UserPermissionsDto = require('./userPermissionsDto');

function safeOptions(options) {
  if (!options) return {};
  return options;
}

function assertValidData(data, options) {
  if (data === undefined) {
    throw new Error('No data has been provided for user');
  }

  if (options.checkAllRequiredFields && !data.id && !options.overrideId) {
    throw new Error('If data does not contain an Id, you have to use overrideId');
  }
  if (options.checkAllRequiredFields && options.overrideId && typeof options.overrideId !== 'string') {
    throw new Error('Overrode id is not of type String');
  }
  if (options.checkAllRequiredFields && !options.overrideId && typeof data.id !== 'string') {
    throw new Error('Id must be defined and of type String');
  }
  if ((data.id && data.id.length > 24) || (options.overrideId && options.overrideId.length > 24)) {
    throw new Error('Overrode id is not of type String');
  }
  if (data.isActive && typeof data.isActive !== 'boolean') {
    throw new Error('isActive must be of type Boolean');
  }
  if (data.username && typeof data.username !== 'string') {
    throw new Error('username must be of type String');
  }
  if (data.fullName && typeof data.fullName !== 'string') {
    throw new Error('username must be of type String');
  }
  if (data.email && typeof data.email !== 'string') {
    throw new Error('email must be of type String');
  }
  if (data.password && typeof data.password !== 'string') {
    throw new Error('password must be of type String');
  }
}

var UserDto = function (data, overrideId) {
  this.id = overrideId || data.id;
	if (data.isActive) this.isActive = data.isActive;
	if (data.username) this.username = data.username;
	if (data.fullName) this.fullName = data.fullName;
	if (data.email) this.email = data.email;
	if (data.password) this.password = data.password;
	this.permissions = new UserPermissionsDto(data);
};

UserDto.prototype = Object.create(Dto.prototype);
UserDto.prototype.constructor = Dto;

UserDto.toDto = function (data, options) {
  options = safeOptions(options);
  assertValidData(data, options);
  return new UserDto(data, options.overrideId);
};

module.exports = UserDto;
