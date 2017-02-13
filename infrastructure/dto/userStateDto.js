'use strict';

var Q = require('q'),
	Dto = require('./dto');

var assertDefinedObj = function(obj) {
	if (obj === undefined) {
		throw 'Invalid Entity';
	}
};

function UserStateDto(playedPosition, mediaQueue, browsingFolderPath, openedPlaylistId, playingMediumInQueueIndex) {
	this.playedPosition = playedPosition;
	this.mediaQueue = mediaQueue;
	this.browsingFolderPath = browsingFolderPath;
	this.openedPlaylistId = openedPlaylistId;
	this.playingMediumInQueueIndex = playingMediumInQueueIndex;
}

UserStateDto.prototype = Object.create(Dto.prototype);
UserStateDto.prototype.constructor = Dto;

UserStateDto.toDto = function (obj) {
	assertDefinedObj(obj); // TODO Should check for types/size

	return new UserStateDto(
		obj.playedPosition,
		obj.mediaQueue,
		obj.browsingFolderPath,
		obj.openedPlaylistId,
		obj.playingMediumInQueueIndex
	);
};

module.exports = UserStateDto;