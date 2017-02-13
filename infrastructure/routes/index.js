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
			},{
				rel: 'users',
				href: '/api/users/'
			},{
				rel: 'user-states',
				href: '/api/user-states/'
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
		login: {
			postPath: '/api/login'
		},
		logout: {
			postPath: '/api/logout'
		},
		isAuthenticated: {
			getPath: '/api/is-authenticated'
		},
		playlists: {
			selfPath: '/api/playlists/:playlistId',
			listMedia: '/api/playlists/:playlistId/media/', // TODO Rename to selfPermissions and use self.media as rel
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
			selfPath: '/api/playlists/:playlistId/media/:mediumId',
			selfPlay: '/api/media/play/:mediumIdWithExt',
			getPath: '/api/playlists/:playlistId',
			insertPath: '/api/playlists/:playlistId/media/',
			updatePath: '/api/playlists/:playlistId/media/:mediumId',
			deletePath: '/api/playlists/:playlistId/media/:mediumId'
		},
		file: {
			selfPlayPattern: /^\/api\/media\/play\/path\/(.*[^\/])$/
		},
		users: {
			selfPath: '/api/users/:userId',
			selfPermissionsPath: '/api/users/:userId/permissions/',
			getPath: '/api/users/',
			updatePath: '/api/users/:userId',
			insertPath: '/api/users/',
			deletePath: '/api/users/:userId'
		},
		userPermissions: {
			//selfPath: '/api/users/:userId/permissions/:userPermissionId',
			getPath: '/api/users/:userId/permissions/',
			updatePath: '/api/users/:userId/permissions/'
			//insertPath: '/api/users/:userId/permissions/',
			//deletePath: '/api/users/:userId/permissions/:userPermissionId'
		},
		userStates: {
			selfPath: '/api/user-states/:userStateId',
			currentUserStatePath: '/api/user-states/current-user-state',
			updatePath: '/api/user-states/:userStateId',
			insertPath: '/api/user-states/',
			deletePath: '/api/user-states/:userStateId'
		}/*,
		config: {
			sendConfig: '/api/config/playableTypes'
		}*/
	}
};