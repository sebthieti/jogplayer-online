'use strict';

var os = require('os'),
	Q = require('q'),
	mongodb = require('mongodb'),
	mongoose = require('mongoose'),
	util = require('util'),
	child_process = require('child_process'),
	Rx = require('rx');

var _dbConnection = null,
	_dbProcess = null,
	_dbConnectionReadySubject = new Rx.BehaviorSubject();

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

SaveService.prototype.disconnectFromDb = function() {
	exitHandler.bind(null, { cleanup: true });
};

SaveService.prototype.observeDbConnectionReady = function() {
	return _dbConnectionReadySubject;
};

function startDbService() {
	// Following is windows cfg
	_dbProcess = child_process.spawn(
		getMongodExecRelativePath(), [
			'--config',
			getMongodConfigRelativePath()
		], {
			cwd: getMongodCwdRelativePath()
		}
	);
	// TODO In linux all directory (logs/db data must exist before running script)

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

function getMongodExecRelativePath() {
	switch (os.platform()) {
		case 'win32':
			return '.\\bin\\mongod.exe';
		case 'linux':
			return 'mongod';
		default:
			return './bin/mongod';
	}
}

function getMongodConfigRelativePath() {
	return os.platform() === "win32"
		? "mongod.conf"
		: "./mongod-unix.conf";
}

function getMongodCwdRelativePath() {
	return os.platform() === "win32"
		? ".\\db"
		: "./db/";
}

function observeConfigAndInit(configObservable) {
	var timeout = os.platform() === "win32" ? 0 : 5000;
	setTimeout(function(){ // TODO In linux we need time before launch. Check for that
		configObservable
			.take(1)
			.do(function(config) {
				initDbClientAsync(config);
				_dbConnectionReadySubject.onNext(true);
				_dbConnectionReadySubject.onCompleted();
			})
			.subscribe(
			function() {},
			function(err) {console.log(err)},
			function() {}
		);
	}, timeout);
}

function initDbClientAsync(config) {
	var db = config.DbConnection;
	var dbConnectionString = util.format('mongodb://%s:%d/%s', db.host, db.port, db.dbName);

	_dbConnection = mongoose.connect(dbConnectionString);
}

module.exports = SaveService;
