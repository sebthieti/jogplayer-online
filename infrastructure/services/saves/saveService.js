'use strict';

var Q = require('q'),
	mongodb = require('mongodb'),
	mongoose = require('mongoose'),
	util = require('util');

var _dbConnection = null;

process.stdin.resume(); //so the program will not close instantly

function exitHandler(options, err) {
	if (options.cleanup) {
		if (_dbConnection) {
			_dbConnection.disconnect();
		}
		console.log('before Gracefull exit');
	}
	if (err) console.log(err.stack);
	if (options.exit) process.exit();
}

// Do something when app is closing
process.on('exit', exitHandler.bind(null, { cleanup: true }));

// Catches ctrl+c event
process.on('SIGINT', exitHandler.bind(null, { exit: true }));

// Catches uncaught exceptions
process.on('uncaughtException', exitHandler.bind(null, { exit: true }));

var initDbClientAsync = function (config) {
	var db = config.DbConnection;
	var dbConnectionString = util.format('mongodb://%s:%d/%s', db.host, db.port, db.dbName);

	_dbConnection = mongoose.connect(dbConnectionString);
};

function SaveService (config) {
	initDbClientAsync(config);
}

module.exports = SaveService;