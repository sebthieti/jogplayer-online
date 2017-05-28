export default {
  api: '/api/', // TODO Clearly separate public endpoint from private def.
  components: [{
    rel: 'explore',
    href: '/api/explore/'
  }, {
    rel: 'login',
    href: '/api/login/'
  }, {
    rel: 'is-authenticated',
    href: '/api/is-authenticated/'
  }, {
    rel: 'favorites',
    href: '/api/favorites/'
  }, {
    rel: 'playlists',
    href: '/api/playlists/'
  }, {
    rel: 'config',
    href: '/api/config/'
  }, {
    rel: 'users',
    href: '/api/users/'
  }, {
    rel: 'state',
    href: '/api/state/'
  }/*,{
   sendConfig: '/api/config/playableType'
   }*/
  ],
  favorites: { // TODO Regen. url according to base endpoint (on top)
    selfPath: '/api/favorites/:favIndex',
    getPath: '/api/favorites/',
    insertPath: '/api/favorites/',
    updatePath: '/api/favorites/:favIndex',
    deletePath: '/api/favorites/:favIndex'
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
    selfPath: '/api/playlists/:playlistIndex',
    listMedia: '/api/playlists/:playlistIndex/media/', // TODO Rename to selfPermissions and use self.media as rel
    getPath: '/api/playlists/',
    insertPath: '/api/playlists/',
    updatePath: '/api/playlists/:playlistIndex',
    delete: {
      pattern: /^\/api\/playlists\/(\w+)?$/,
      path: '/api/playlists/:playlistIndex'
    },
    actions: {
      movePath: '/api/actions/playlists/move/',
      copyPath: 'TODO'
    }
  },
  media: {
    selfPath: '/api/playlists/:playlistIndex/media/:mediumId',
    selfPlay: '/api/media/play/:mediumIdWithExt',
    getPath: '/api/playlists/:playlistIndex',
    insertPath: '/api/playlists/:playlistIndex/media/',
    updatePath: '/api/playlists/:playlistIndex/media/:mediumId',
    deletePath: '/api/playlists/:playlistIndex/media/:mediumId'
  },
  file: {
    selfPlayPattern: /^\/api\/media\/play\/path\/(.*[^\/])$/
  },
  explore: {
    fileInfoPathPattern: '/api/explore:relativePath',
    directoryPattern: /^\/api\/explore\/(.*[\/])*$/,
    fileInfoPattern: /^\/api\/explore\/(.*[\/].*)*$/
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
    selfPath: '/api/users/:userId/permissions/',
    getPath: '/api/users/:userId/permissions/',
    updatePath: '/api/users/:userId/permissions/'
    //insertPath: '/api/users/:userId/permissions/',
    //deletePath: '/api/users/:userId/permissions/:userPermissionId'
  },
  userStates: {
    selfPath: '/api/state',
    currentUserStatePath: '/api/state/current-user-state',
    updatePath: '/api/state'
  }/*,
   config: {
   sendConfig: '/api/config/playableTypes'
   }*/
};
