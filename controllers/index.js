(function(controllers) {

	var playlistController = require('./playlistController');
	controllers.init = function(app, playlistsBusiness) {
		playlistController.init(app, playlistsBusiness);
	}

})(module.exports);