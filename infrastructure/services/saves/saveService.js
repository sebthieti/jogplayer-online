'use strict';

var Q = require('q'),
	mongodb = require('mongodb'),
	mongoose = require('mongoose'),
	util = require('util'),
	child_process = require('child_process'),
	Rx = require('rx');

var _dbConnection = null,
	_dbProcess = null;

process.stdin.resume(); //so the program will not close instantly

function exitHandler(options, err) {
	if (options.cleanup) {
		if (_dbConnection) {
			_dbConnection.disconnect();
		}
		if (_dbProcess) {
			_dbProcess.kill();
		}
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

function SaveService (configObservable) {
	startDbService();
	observeConfigAndInit(configObservable);
}

function startDbService() {
	_dbProcess = child_process.spawn(
		'.\\bin\\mongod.exe', [
		'--config',
		'mongod.conf'
		], {
			cwd: 'C:\\_PROJECTS\\GitHub\\jogplayer-online\\db' // TODO S/b config
		}
	);
	_dbProcess.stdout.on('data', function (data) {
		console.log('stdout: ' + data);
	});

	_dbProcess.stderr.on('data', function (data) {
		console.log('stderr: ' + data);
	});

	_dbProcess.on('close', function (code) {
		console.log('child process exited with code ' + code);
	});
}

function observeConfigAndInit(configObservable) {
	configObservable
		.take(1)
		.do(function(config) {
			initDbClientAsync(config);
		})
		.subscribe(
			function() {},
			function(err) {console.log(err)},
			function() {}
		);
}

function initDbClientAsync(config) {
	var db = config.DbConnection;
	var dbConnectionString = util.format('mongodb://%s:%d/%s', db.host, db.port, db.dbName);

	_dbConnection = mongoose.connect(dbConnectionString);
}

module.exports = SaveService;