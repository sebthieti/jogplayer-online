'use strict';

var mongoose = require('mongoose'),
	Schema = mongoose.Schema;

var _mediaRoutes;

var mediaSchema = new Schema({
	_playlistId: { type: Schema.Types.ObjectId, ref: 'Playlist' },
	title: String,
	createdOn: { type: Date },
	updatedOn: { type: Date },
	filePath: String,
	isChecked: { type: Boolean, default: true },
	mustRelocalize: Boolean,
	mediaType: String,
	index: Number,
	duration: Number,
	mimeType: String,
	ext: String//,
	//metadatas: [],
	//bookmarks: [{ type: Schema.Types.ObjectId, ref: 'Bookmark' }]
});
mediaSchema.set('toJSON', { virtuals: true });
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

module.exports = function(mediaRoutes){
	_mediaRoutes = mediaRoutes;
	return mongoose.model('Media', mediaSchema);
};