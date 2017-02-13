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

	// Explore directory path TODO Use constants for url instead
	_app.get(/^\/api\/explore\/(.*[\/])*$/, _authDirector.ensureApiAuthenticated, function (req, res) {
		_fileExplorerDirector
			.getFolderContentAsync(extractUrlFromParams(req.params), req.user)
			.then(function(fileDetails) { res.send(fileDetails) })
			.catch(function(err) { res.status(400).send(err) })
			.done();
	});

	// Get file info by path
	_app.get(/^\/api\/explore\/(.*[\/].*)*$/, _authDirector.ensureApiAuthenticated, function (req, res) {
		_fileExplorerDirector
			.getFileInfoAsync(extractUrlFromParams(req.params), req.user)
			.then(function(fileDetails) { res.send(fileDetails) })
			.catch(function(err) { res.status(400).send(err) })
			.done();
	});

};

module.exports = FileExplorerController;