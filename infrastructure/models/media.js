'use strict';

var mongoose = require('mongoose'),
	Schema = mongoose.Schema;

var mediaSchema = new Schema({
	//_creator: { type: Schema.Types.ObjectId, ref: 'Playlist' },
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

module.exports = mongoose.model('Media', mediaSchema);