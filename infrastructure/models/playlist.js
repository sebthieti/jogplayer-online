'use strict';

var mongoose = require('mongoose'),
	Schema = mongoose.Schema,
	_ = require('underscore');

var Playlist,
	_plRoutes,
	_plListMediaRoute;

var playlistSchema = new Schema({
	name: String,
	index: Number,
	filePath: String,
	isChecked: { type: Boolean, default: true },
	media: [{ type: Schema.Types.ObjectId, ref: 'Media' }],
	createdOn: { type: Date, default: Date.now },
	updatedOn: { type: Date }
});
playlistSchema.virtual('isVirtual').get(function() {
	return !this.filePath;
});
// TODO Think about remove this and only compute it elsewhere (maybe only put it to DTO ?)
playlistSchema.virtual('isAvailable').get(function() {
	return this._isAvailable || false;
}).set(function(value) {
	this._isAvailable = value;
});
playlistSchema.statics.whereInOrGetAll = function (path, whereIn) {
	return whereIn ? this.where(path).in(whereIn) : this;
};
playlistSchema.set('toJSON', { virtuals: true });
playlistSchema.virtual('links').get(function() {
	return [{
		rel: 'self',
		href: _plRoutes.selfPath.replace(':playlistId', this._id)
	},{
		rel: 'media',
		href: _plRoutes.listMedia.replace(':playlistId', this._id)
	},{
		rel: 'media.insert',
		href: _plListMediaRoute.insertPath.replace(':playlistId', this._id)
	},{
		rel: 'update',
		href: _plRoutes.updatePath.replace(':playlistId', this._id)
	},{
		rel: 'remove',
		href: _plRoutes.delete.path.replace(':playlistId', this._id)
	},{
		rel: 'actions.move',
		href: _plRoutes.actions.movePath.replace(':playlistId', this._id)
	}];
});
playlistSchema.methods.setMedia = (function (media) {
	this.media = media;
	return this;
});
playlistSchema.methods.setUpdatedOn = (function (updatedOn) {
	this.updatedOn = updatedOn;
	return this;
});

module.exports = function(plRoutes, plListMediaRoute){
	_plRoutes = plRoutes;
	_plListMediaRoute = plListMediaRoute;
	Playlist = mongoose.model('Playlist', playlistSchema);
	return Playlist;
};