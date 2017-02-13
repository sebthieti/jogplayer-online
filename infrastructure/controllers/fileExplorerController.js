'use strict';

var _app,
	_mediaStreamer,
	_fileExplorerDirector,
	_authDirector;

function extractUrlFromParams(params) {
	return ('/' + (params[0] || '')) || '';
}

function FileExplorerController(app, mediaStreamer, fileExplorerDirector, authDirector) {
	_app = app;
	_mediaStreamer = mediaStreamer;
	_fileExplorerDirector = fileExplorerDirector;
	_authDirector = authDirector;
}

FileExplorerController.prototype.init = function() {
	_app.get("/", _authDirector.ensureApiAuthenticated, function(req, res) {
		res.render("index");
	});

	// Explore path TODO Use constants for url instead
	_app.get(/^\/api\/explore\/(.*[\/])*$/, _authDirector.ensureApiAuthenticated, function (req, res) {
		_fileExplorerDirector
			.getFolderContentAsync(extractUrlFromParams(req.params))
			.then(function(fileDetails) { res.send(fileDetails) })
			.catch(function(err) { res.send(400, err) })
			.done();
	});

	_app.get(/^\/api\/explore\/(.*[\/].*)*$/, _authDirector.ensureApiAuthenticated, function (req, res) {
		_fileExplorerDirector
			.getFileInfoAsync(extractUrlFromParams(req.params))
			.then(function(fileDetails) { res.send(fileDetails) })
			.catch(function(err) { res.send(400, err) })
			.done();
	});

};

module.exports = FileExplorerController;