var Playlist = (function () {
	'use strict'
	
	function Playlist(id, index, plName, filePath, isSelected, createdOn, updatedOn, medias) {
		this._id = id;
		this.createdOn = createdOn;
		this.updatedOn = updatedOn;
		this.plName = plName;
		this.index = index;
		this.filePath = filePath;
		this.isSelected = isSelected;
		this.medias = medias;
	}

	Playlist.prototype.getIsVirtual = function () {
		return !this.filePath;
	}

	Playlist.prototype.setMedias = function (medias) {
		this.medias = medias;
		return this;
	}

	Playlist.prototype.clone = function () {
		//return new Playlist.apply(this);
		return new Playlist(
			this._id, // TODO another id toString
			this.index,
			this.plName,
			this.filePath,
			this.isSelected,
			this.createdOn,
			this.updatedOn,
			this.medias
		);
	}

	Playlist.fromDto = function (dtoPlaylist) {
		return new Playlist(
			dtoPlaylist._id, // TODO another id toString
			dtoPlaylist.index,
			dtoPlaylist.plName,
			dtoPlaylist.filePath,
			dtoPlaylist.isSelected,
			dtoPlaylist.createdOn,
			dtoPlaylist.updatedOn,
			dtoPlaylist.medias
		);
	}

//	Playlist.toDto = function (dtoPlaylist) {
//		// TODO have to check everything
//		return new Playlist(
//			dtoPlaylist._id, // TODO another id toString
//			dtoPlaylist.index,
//			dtoPlaylist.plName,
//			dtoPlaylist.filePath,
//			dtoPlaylist.isSelected,
//			dtoPlaylist.createdOn,
//			dtoPlaylist.updatedOn,
//			dtoPlaylist.medias
//		);
//	}

//	Playlist.toDataSafe = function (pl) {
//		var hasMandatoryFields = pl &&
//			!pl._id &&
//			pl.plName &&
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
//			dtoPlaylist.plName,
//			dtoPlaylist.filePath,
//			dtoPlaylist.isSelected,
//			dtoPlaylist.createdOn,
//			dtoPlaylist.updatedOn,
//			dtoPlaylist.medias
//		);
//	}

	return Playlist;
})();

module.exports = Playlist;