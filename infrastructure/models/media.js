'use strict';
// TODO Rename file to medium not media
var mongoose = require('mongoose');
require('mongoose-types-ext')(mongoose);
var Schema = mongoose.Schema;

var _mediaRoutes,
	Media;

var mediumSchema = new Schema({
	ownerId: { type: Schema.Types.ObjectId, ref: 'User' },
	_playlistId: { type: Schema.Types.ObjectId, ref: 'Playlist' },
	title: { type: String, maxLength: 256 },
	createdOn: { type: Date },
	updatedOn: { type: Date },
	filePath: { type: String, maxLength: 256 },
	isChecked: { type: Boolean, default: true },
	mediaType: String,
	index: Number,
	duration: Number,
	mimeType: String,
	ext: String//,
	//metadatas: [],
	//bookmarks: [{ type: Schema.Types.ObjectId, ref: 'Bookmark' }]
});
// TODO Think about remove this and only compute it elsewhere (maybe only put it to DTO ?)
mediumSchema.virtual('isAvailable').get(function() {
	return this._isAvailable || false;
}).set(function(value) {
	this._isAvailable = value;
});
mediumSchema.set('toJSON', { virtuals: true });
// virtuals: false to avoid inserting links to database
mediumSchema.set('toObject', { virtuals: false });
mediumSchema.methods.toJSON = function() {
	var obj = this.toObject();
	obj.id = obj._id;
	obj.links = this.links;
	delete obj._id;
	delete obj.__v;
	delete obj._playlistId;
	delete obj.ownerId;
	delete obj.filePath;
	delete obj.createdOn;
	delete obj.updatedOn;
	return obj;
};
mediumSchema.virtual('links').get(function() {
	return [{
		rel: 'self',
		href: _mediaRoutes.selfPath
			.replace(':playlistId', this._playlistId)
			.replace(':mediumId', this._id)
	},{
		rel: 'self.play',
		href: _mediaRoutes.selfPlay.replace(':mediumIdWithExt', this._id + this.ext)
	},{
		rel: 'update',
		href: _mediaRoutes.updatePath
			.replace(':playlistId', this._playlistId)
			.replace(':mediumId', this._id)
	},{
		rel: 'remove',
		href: _mediaRoutes.deletePath
			.replace(':playlistId', this._playlistId)
			.replace(':mediumId', this._id)
	}];
});
mediumSchema.methods.setIsAvailable = function (isAvailable) {
	this.isAvailable = isAvailable;
	return this;
};

module.exports = function(mediaRoutes){
	_mediaRoutes = mediaRoutes;
	Media = mongoose.model('Media', mediumSchema);
	return Media;
};
