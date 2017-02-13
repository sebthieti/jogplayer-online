var Q = require('q'),
	from = require('fromjs');

var _playlistProxy,
	_playlistsProxy;

function PlaylistProxyMediator (playlistProxy, playlistsProxy) {
	_playlistProxy = playlistProxy;
	_playlistsProxy = playlistsProxy;
}

PlaylistProxyMediator.prototype.init = function() {
	_playlistProxy
		.observeUpdatePlaylistIdsPosition()
		.do(function(userId){
			_playlistsProxy.playlistsPositionChangeByUserId(userId);
		})
		.subscribe();

	_playlistsProxy
		.observePlaylistRemoveById()
		.do(function(playlistId){
			_playlistProxy.playlistRemovedById(playlistId);
		})
		.subscribe();

	_playlistsProxy
		.observePlaylistInsertion()
		.do(function(playlist){
			_playlistProxy.playlistInserted(playlist);
		})
		.subscribe();
};

module.exports = PlaylistProxyMediator;