'use strict';

var Q = require('q'),
	fs = require('fs'),
	path = require('path'),
	utils = require('../utils'),
	Rx = require('rx');

var _configFileIsValidSubject = new Rx.BehaviorSubject();

function ConfigService() {
	checkFileConfigExistsAsyncAndSetSubject.call(this);
}

function checkFileConfigExistsAsyncAndSetSubject() {
	return this
		.checkFileConfigExistsAsync()
		.then(function(exists) {
			if (exists) {
				_configFileIsValidSubject.onNext(require('config'));
			}
		});
}

ConfigService.prototype.checkFileConfigExistsAsync = function() {
	return Q.nfcall(
		fs.open,
		path.join(process.cwd(), 'config/default.json'),
		'r',
		'0o666'
	)
	.then(function(fd) {
		return Q.nfcall(fs.close, fd);
	})
	.then(function () {
		return true;
	})
	.catch(function() { // Error means file doesn't exists
		return false;
	});
};

ConfigService.prototype.observeConfigFile = function() {
	return _configFileIsValidSubject.where(function(x) {return x !== undefined});
};

ConfigService.prototype.setDbConfigAsync = function(config) {
	return setDbConfigWithConfigAsync(config, 'config/default.json');
};

ConfigService.prototype.setDbConfigForTestsAsync = function(config) {
	return setDbConfigWithConfigAsync(config, 'config/unit-tests.json');
};

function setDbConfigWithConfigAsync(config, configPath) {
	return Q.nfcall(
			fs.writeFile,
			path.join(process.cwd(), configPath),
			buildJsonConfig(config)
		)
		.then(function() {
			_configFileIsValidSubject.onNext(require('config'));
		});
}

function buildJsonConfig(config) {
	return JSON.stringify({
		DbConnection: {
			host: config.host,
			port: config.port,
			dbName: config.dbName
		}
	})
}

module.exports = ConfigService;
