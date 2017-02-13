'use strict';

var mongoose = require('mongoose'),
	Schema = mongoose.Schema;

var _mediaRoutes,
	Media;

var mediaSchema = new Schema({ // TODO Rename to mediumSchema
	_playlistId: { type: Schema.Types.ObjectId, ref: 'Playlist' },
	title: String,
	createdOn: { type: Date },
	updatedOn: { type: Date },
	filePath: String,
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
mediaSchema.virtual('isAvailable').get(function() {
	return this._isAvailable || false;
}).set(function(value) {
	this._isAvailable = value;
});
mediaSchema.set('toJSON', { virtuals: true });
mediaSchema.set('toObject', { virtuals: true });
mediaSchema.methods.toJSON = function() {
	var obj = this.toObject();
	delete obj._id;
	delete obj.__v;
	delete obj._playlistId;
	delete obj.filePath;
	delete obj.createdOn;
	delete obj.updatedOn;
	return obj;
};
mediaSchema.virtual('links').get(function() {
	return [{
		rel: 'self',
		href: _mediaRoutes.selfPath
			.replace(':playlistId', this._playlistId)
			.replace(':mediaId', this._id)
	},{
		rel: 'self.play',
		href: _mediaRoutes.selfPlay.replace(':mediaIdWithExt', this._id + this.ext)
	},{
		rel: 'update',
		href: _mediaRoutes.updatePath
			.replace(':playlistId', this._playlistId)
			.replace(':mediaId', this._id)
	},{
		rel: 'remove',
		href: _mediaRoutes.deletePath
			.replace(':playlistId', this._playlistId)
			.replace(':mediaId', this._id)
	}];
});
mediaSchema.methods.setIsAvailable = function (isAvailable) {
	this.isAvailable = isAvailable;
	return this;
};

module.exports = function(mediaRoutes){
	_mediaRoutes = mediaRoutes;
	Media = mongoose.model('Media', mediaSchema);
	return Media;
};