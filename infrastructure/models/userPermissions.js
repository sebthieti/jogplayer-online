'use strict';

var mongoose = require('mongoose'),
	Schema = mongoose.Schema;

var _routes;

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
		href: _routes.userPermissions.updatePath.replace(':userId', this.id)
	},(function(self){
		return self.homePath
			? {
			rel: 'self.browsingFolderPath',
			href: _routes.explore.fileInfoPathPattern.replace(':relativePath', self.homePath)
		} : {}
	}(this)) ];
});

module.exports = function(routes){
	_routes = routes;
	return mongoose.model('UserPermission', userPermissionsSchema);
};