'use strict';

var mongoose = require('mongoose'),
	Schema = mongoose.Schema;

var _userPermissionsRoutes;

var userPermissionsSchema = new Schema({
	//userId: { type: Schema.Types.ObjectId, ref: 'User' },
	canWrite: Boolean,
	isAdmin: Boolean,
	isRoot: Boolean, // TODO This one must be read only
	allowPaths: [ String ],
	denyPaths: [ String ],
	homePath: String
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
	delete obj.userId;
	delete obj.__v;
	return obj;
};
userPermissionsSchema.virtual('links').get(function() {
	return [{
		rel: 'update',
		href: _userPermissionsRoutes.updatePath.replace(':userId', this.id)
	}];
});

module.exports = function(userPermissionsRoutes){
	_userPermissionsRoutes = userPermissionsRoutes;
	return mongoose.model('UserPermission', userPermissionsSchema);
};