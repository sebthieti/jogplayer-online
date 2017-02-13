module.exports = function () {
	return {
		api: '/api/', // TODO Clearly separate public endpoint from private def.
		components: [{
				rel: 'explore',
				href: '/api/explore/'
			},{
				rel: 'favorites',
				href: '/api/favorites/'
			},{
				rel: 'playlists',
				href: '/api/playlists/'
			},{
				rel: 'config',
				href: '/api/config/'
			}/*,{
				sendConfig: '/api/config/playableType'
			}*/
		],
		favorites: { // TODO Regen. url according to base endpoint (on top)
			selfPath: '/api/favorites/:favId',
			getPath: '/api/favorites/',
			insertPath: '/api/favorites/',
			updatePath: "/api/favorites/:favId",
			deletePath: "/api/favorites/:favId"
		},
		playlists: {
			selfPath: '/api/playlists/:playlistId',
			listMedia: '/api/playlists/:playlistId/media/',
			getPath: '/api/playlists/',
			insertPath: '/api/playlists/',
			updatePath: "/api/playlists/:playlistId",
			delete: {
				pattern: /^\/api\/playlists\/(\w+)?$/,
				path: "/api/playlists/:playlistId"
			},
			actions: {
				movePath: '/api/actions/playlists/move/',
				copyPath: 'TODO'
			}
		},
		media: {
			selfPath: '/api/playlists/:playlistId/media/:mediaId',
			selfPlay: '/api/media/play/:mediaIdWithExt',
			getPath: '/api/playlists/:playlistId',
			insertPath: '/api/playlists/:playlistId/media/',
			updatePath: '/api/playlists/:playlistId/media/:mediaId',
			deletePath: '/api/playlists/:playlistId/media/:mediaId'
		},
		file: {
			selfPlayPattern: /^\/api\/media\/play\/path\/(.*[^\/])$/
		}/*,
		config: {
			sendConfig: '/api/config/playableTypes'
		}*/
	}
};