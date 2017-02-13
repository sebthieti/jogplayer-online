(function(controllers) {

	var playlistController = require('./playlistController');
	var mediaController = require('./mediaController');
	
	controllers.init = function(app, io, playlistsBusiness) {
		playlistController.init(app, playlistsBusiness);
		mediaController.init(app, io);

		app.get('/', function(req, res) {
			res.render('index');
		});
	}

})(module.exports);