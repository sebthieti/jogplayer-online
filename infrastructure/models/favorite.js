'use strict';

var mongoose = require('mongoose'),
	Schema = mongoose.Schema;

var _favRoutes;

var favoriteSchema = new Schema({
	ownerId: { type: Schema.Types.ObjectId, ref: 'User' },
	name: String,
	createdOn: { type: Date, default: Date.now },
	updatedOn: { type: Date },
	folderPath: String,
	index: Number
});
favoriteSchema.set('toJSON', { virtuals: true });
// virtuals: false to avoid inserting links to database
favoriteSchema.set('toObject', { virtuals: false });
favoriteSchema.methods.toJSON = function() {
	var obj = this.toObject();
	obj.id = obj._id;
	obj.links = this.links;
	delete obj._id;
	delete obj.__v;
	delete obj.ownerId;
	delete obj.createdOn;
	delete obj.updatedOn;
	return obj;
};
favoriteSchema.virtual('links').get(function() {
	return [{
		rel: 'self',
		href: _favRoutes.selfPath.replace(':favId', this._id)
	},{
		rel: 'target',
		href: '/api/explore' + this.folderPath // TODO Refactor
	},{
		rel: 'update',
		href: _favRoutes.updatePath.replace(':favId', this._id)
	},{
		rel: 'remove',
		href: _favRoutes.deletePath.replace(':favId', this._id)
	}];
});

module.exports = function(favRoutes){
	_favRoutes = favRoutes;
	return mongoose.model('Favorite', favoriteSchema);
};