var FavoriteType = {
	AUDIO: 'Audio',
	VIDEO: 'Video'
}

var Favorite = (function () {
	'use strict'
	
	function Favorite(id, favType, favName, targetFolderPath) {
		this._id = id;
		this.favType = favType;
		this.favName = favName;
		this.targetFolderPath = targetFolderPath;		
	}

	return Favorite;
})();

module.exports.Favorite = Favorite;
module.exports.FavoriteType = FavoriteType;