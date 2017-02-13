'use strict';

var mongoose = require('mongoose'),
	Schema = mongoose.Schema;

var _userRoutes;

var userSchema = new Schema({
	isActive: Boolean,
	username: { type: String, required: 'Username is mandatory' },
	password: { type: String, required: 'Password is mandatory' },
	passwordSalt: { type: String, required: 'PasswordSalt is mandatory' },
	fullName: String,
	email: String,
	//state: { type: Schema.Types.ObjectId, ref: 'UserState' }
	permissions: { type: Schema.Types.ObjectId, ref: 'UserPermission' }
});
userSchema.set('toJSON', { virtuals: true });
// virtuals: false to avoid inserting links to database
userSchema.set('toObject', { virtuals: false });
userSchema.methods.toJSON = function() {
	var obj = this.toObject();
	//var f = this.permissions.toJSON();

	obj.links = this.links;

	delete obj._id;
	delete obj.permissions;
	obj.permissions = this.permissions.toJSON();
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
		href: _userRoutes.selfPath.replace(':userId', this.id)
	}/*, {
		rel: 'self.permissions',
		href: _userRoutes.selfPermissionsPath.replace(':userId', this.id)
	}*/, {
		rel: 'update',
		href: _userRoutes.updatePath.replace(':userId', this._id)
	}, {
		rel: 'remove',
		href: _userRoutes.deletePath.replace(':userId', this._id)
	}];
});

module.exports = function(userRoutes){
	_userRoutes = userRoutes;
	return mongoose.model('User', userSchema);
};