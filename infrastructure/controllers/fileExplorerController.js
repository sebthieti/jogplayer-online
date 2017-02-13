'use strict';

var _app,
	_mediaStreamer,
	_fileExplorerRepository;

function FileExplorerController (app, mediaStreamer, fileExplorerRepository) {
	_app = app;
	_mediaStreamer = mediaStreamer;
	_fileExplorerRepository = fileExplorerRepository;
}

FileExplorerController.prototype.init = function() {
	_app.get("/", function(req, res) {
		res.render("index");
	});

	// Explore path
	_app.get(/^\/api\/explore\/(.*[\/])*$/, function (req, res) {
		var extractedUrlPath = ('/' + (req.params[0] || '')) || '';
		_fileExplorerRepository
			.getFolderContentAsync(extractedUrlPath)
			.then(function(fileDetails) {
				res.send(fileDetails);
			})
			.catch(function(err) {
				res.send(400, err)
			})
			.done();
	});
};

module.exports = FileExplorerController;