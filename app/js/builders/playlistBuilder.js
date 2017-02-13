jpoApp.factory('playlistBuilder', function() {
	return {
		buildEmptyPlaylist: function () {
			return {
				name: '',
				checked: true,
				media: []
			}
		}
	}
});