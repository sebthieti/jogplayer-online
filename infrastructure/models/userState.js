'use strict';

var mongoose = require('mongoose'),
	Schema = mongoose.Schema;

var _plRoutes;

var userStateSchema = new Schema({
	ownerId: { type: Schema.Types.ObjectId, ref: 'User' },
	playedPosition: Number,
	mediaQueue: [ String ],
	browsingFolderPath: String,
	openedPlaylistId: String, // TODO Put a link url in it ?
	playingMediumInQueueIndex: Number
});
userStateSchema.set('toJSON', { virtuals: true });
// virtuals: false to avoid inserting links to database
userStateSchema.set('toObject', { virtuals: false });
userStateSchema.methods.toJSON = function() {
	var obj = this.toObject();
	// TODO This id is used only for client side's ui. Client should rather only use its own ids
	obj.links = this.links;
	delete obj._id;
	delete obj.ownerId;
	delete obj.__v;
	return obj;
};
userStateSchema.virtual('links').get(function() {
	return [{
		rel: 'self',
		href: _plRoutes.selfPath.replace(':userStateId', this.id)
	},{
		rel: 'update',
		href: _plRoutes.updatePath.replace(':userStateId', this._id)
	},{
		rel: 'remove',
		href: _plRoutes.deletePath.replace(':userStateId', this._id)
	}];
});

module.exports = function(plRoutes){
	_plRoutes = plRoutes;
	return mongoose.model('UserState', userStateSchema);
};