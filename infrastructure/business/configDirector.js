'use strict';

var Q = require('q'),
	Rx = require('rx');

var _configFileIsValidSubject = new Rx.BehaviorSubject(false),
	_setupService,
	_configSaveService,
	_userDirector;

function ConfigDirector(setupService, userDirector, configSaveService) {
	_setupService = setupService;
	_userDirector = userDirector;
	_configSaveService = configSaveService;

	checkFileConfigExistsAsync();
}

function checkFileConfigExistsAsync() {
	return _setupService
		.checkFileConfigExistsAsync()
		 .then(function(exists) {
		    _configFileIsValidSubject.onNext(exists);
		 });
}

ConfigDirector.prototype.observeValidConfigFile = function() {
	return _configFileIsValidSubject.where(function(x) { return x });
};

ConfigDirector.prototype.observeConfigFile = function() {
	return _configFileIsValidSubject;
};

ConfigDirector.prototype.setRootUserAsync = function(rootUserDto) {
	return _userDirector
		.addRootUserAsync({
			username: rootUserDto.username,
			password: rootUserDto.password
		});
};

ConfigDirector.prototype.isDbInitializedAsync = function() {
	return isRootUserFileConfigExistsAsync();
};

function isRootUserFileConfigExistsAsync() {
	return _userDirector.isRootUserSetAsync();
}

module.exports = ConfigDirector;