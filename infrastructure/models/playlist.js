'use strict';

var mongoose = require('mongoose'),
	Schema = mongoose.Schema;

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
//playlistSchema.virtual('setMedias').set(function (medias) {
//	this.medias = medias;
//	return this;
//});
playlistSchema.statics.whereInOrGetAll = function (path, whereIn) {
	return whereIn ? this.where(path).in(whereIn) : this;
};

module.exports = mongoose.model('Playlist', playlistSchema);


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