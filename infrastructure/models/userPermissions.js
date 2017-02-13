'use strict';

var mongoose = require('mongoose'),
	Schema = mongoose.Schema;

var _plRoutes;

var userPermissionsSchema = new Schema({
	userId: { type: Schema.Types.ObjectId, ref: 'User' },
	allowedPaths: [ String ]
});

userPermissionsSchema.set('toJSON', { virtuals: true });
// virtuals: false to avoid inserting links to database
userPermissionsSchema.set('toObject', { virtuals: false });
userPermissionsSchema.methods.toJSON = function() {
	var obj = this.toObject();
	// TODO This id is used only for client side's ui. Client should rather only use its own ids
	//obj.id = obj._id;
	obj.links = this.links;
	delete obj._id;
	delete obj.__v;
	return obj;
};
userPermissionsSchema.virtual('links').get(function() {
	return [{
		rel: 'self',
		href: _plRoutes.selfPath
			.replace(':userId', this.id)
			.replace(':userPermissionId', this.id)
	},{
		rel: 'update',
		href: _plRoutes.updatePath
			.replace(':userId', this.id)
			.replace(':userPermissionId', this.id)
	},{
		rel: 'remove',
		href: _plRoutes.deletePath
			.replace(':userId', this.id)
			.replace(':userPermissionId', this.id)
	}];
});

module.exports = function(plRoutes){
	_plRoutes = plRoutes;
	return mongoose.model('UserPermissions', userPermissionsSchema);
};