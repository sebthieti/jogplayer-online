'use strict';

var mongoose = require('mongoose'),
	Schema = mongoose.Schema;

var _plRoutes,
	_plListMediaRoute;

var playlistSchema = new Schema({
	name: String,
	createdOn: { type: Date, default: Date.now },
	updatedOn: { type: Date },
	index: Number,
	filePath: String,
	isChecked: { type: Boolean, default: true },
	mustRelocalize: Boolean,
	media: [{ type: Schema.Types.ObjectId, ref: 'Media' }]
});
playlistSchema.virtual('isVirtual').get(function() {
	return !this.filePath;
});
playlistSchema.statics.whereInOrGetAll = function (path, whereIn) {
	return whereIn ? this.where(path).in(whereIn) : this;
};
//playlistSchema.virtual('setMedia').set (function (media) {
//	this.media = media;
//	//return this;
//});
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

module.exports = function(plRoutes, plListMediaRoute){
	_plRoutes = plRoutes;
	_plListMediaRoute = plListMediaRoute;
	return mongoose.model('Playlist', playlistSchema);
};

//
//	Playlist.fromDto = function (dtoPlaylist) {
//		return new Playlist(
//			dtoPlaylist._id, // TODO another id toString
//			dtoPlaylist.index,
//			dtoPlaylist.name, // TODO change db names
//			dtoPlaylist.filePath,
//			dtoPlaylist.isSelected,
//			dtoPlaylist.createdOn,
//			dtoPlaylist.updatedOn,
//			dtoPlaylist.medias
//		);
//	}
//
//	Playlist.toDto = function (dtoPlaylist) {
//		// TODO have to check everything
//		return new Playlist(
//			dtoPlaylist._id, // TODO another id toString
//			dtoPlaylist.index,
//			dtoPlaylist.name,
//			dtoPlaylist.filePath,
//			dtoPlaylist.isSelected,
//			dtoPlaylist.createdOn,
//			dtoPlaylist.updatedOn,
//			dtoPlaylist.medias
//		);
//	}
//
//	Playlist.toDataSafe = function (pl) {
//		var hasMandatoryFields = pl &&
//			!pl._id &&
//			pl.name &&
//			pl.index &&
//			pl.isSelected &&
//			pl.createdOn &&
//			pl.medias; // TODO Have to validate medias
//		if (!hasMandatoryFields) {
//			throw "Playlist object doesn't have all mandatory fields.";
//		}
//
//		// TODO have to check everything
//		return new Playlist(
//			dtoPlaylist._id, // TODO another id toString
//			dtoPlaylist.index,
//			dtoPlaylist.name,
//			dtoPlaylist.filePath,
//			dtoPlaylist.isSelected,
//			dtoPlaylist.createdOn,
//			dtoPlaylist.updatedOn,
//			dtoPlaylist.medias
//		);
//	}
//
//	return Playlist;
//})();
//
//module.exports = Playlist;