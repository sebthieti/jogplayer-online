'use strict';

var _app,
	_mediaStreamer,
	_fileExplorerDirector;

function extractUrlFromParams(params) {
	return ('/' + (params[0] || '')) || '';
}

var FileExplorerController = function (app, mediaStreamer, fileExplorerDirector) {
	_app = app;
	_mediaStreamer = mediaStreamer;
	_fileExplorerDirector = fileExplorerDirector;
};

FileExplorerController.prototype.init = function() {
	_app.get("/", function(req, res) {
		res.render("index");
	});

	// Explore path
	_app.get(/^\/api\/explore\/(.*[\/])*$/, function (req, res) {
		_fileExplorerDirector
			.getFolderContentAsync(extractUrlFromParams(req.params))
			.then(function(fileDetails) { res.send(fileDetails) })
			.catch(function(err) { res.send(400, err) })
			.done();
	});
};

module.exports = FileExplorerController;