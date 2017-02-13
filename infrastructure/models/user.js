'use strict';

var mongoose = require('mongoose'),
	Schema = mongoose.Schema;

var _plRoutes;

var userSchema = new Schema({
	username: { type: String, required: 'Username is mandatory' },
	password: { type: String, required: 'Password is mandatory' },
	passwordSalt: { type: String, required: 'PasswordSalt is mandatory' },
	fullName: String,
	email: String,
	canWrite: Boolean,
	isAdmin: Boolean,
	isRoot: Boolean, // TODO This one must be read only
	role: String,
	//state: { type: Schema.Types.ObjectId, ref: 'UserState' }
	permissions: { type: Schema.Types.ObjectId, ref: 'UserPermission' }
});
userSchema.set('toJSON', { virtuals: true });
// virtuals: false to avoid inserting links to database
userSchema.set('toObject', { virtuals: false });
userSchema.methods.toJSON = function() {
	var obj = this.toObject();
	// TODO This id is used only for client side's ui. Client should rather only use its own ids
	obj.id = obj._id;
	obj.links = this.links;
	obj.permissions = obj.permissions.allowedPath || obj.permissions.allowedPaths;

	delete obj._id;
	//delete obj.canWrite;
	//delete obj.isAdmin;
	delete obj.password;
	delete obj.passwordSalt;
	delete obj.__v;
	return obj;
};
userSchema.virtual('links').get(function() {
	return [{
		rel: 'self',
		href: _plRoutes.selfPath.replace(':userId', this.id)
	},{
		rel: 'update',
		href: _plRoutes.updatePath.replace(':userId', this._id)
	},{
		rel: 'remove',
		href: _plRoutes.deletePath.replace(':userId', this._id)
	}];
});

module.exports = function(plRoutes){
	_plRoutes = plRoutes;
	return mongoose.model('User', userSchema);
};