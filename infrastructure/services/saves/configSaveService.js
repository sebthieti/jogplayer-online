'use strict';

var Q = require('q');

var User;

function ConfigSaveService(userModel) {
	User = userModel;
}

ConfigSaveService.prototype.addRootUserAsync = function(user) {
	//isActive: Boolean,
	//	username: { type: String, required: 'Username is mandatory' },
	//password: { type: String, required: 'Password is mandatory' },
	//passwordSalt: { type: String, required: 'PasswordSalt is mandatory' },
	//fullName: String,
	//	email: String,
	//	//state: { type: Schema.Types.ObjectId, ref: 'UserState' }
	//	permissions: { type: Schema.Types.ObjectId, ref: 'UserPermission' }




	return User.create({
		isActive: true,
		username: '',
		password: '',
		passwordSalt: '',
		fullName: '',


	}, function(err, newUser) {
		if (err) { defer.reject(err) }
		else {
			newUser.permissions = userPermissionsModel;
			newUser.save(function(writeError) {
				if (writeError) { defer.reject(writeError) }
				else { defer.resolve(newUser) }
			});
		}
	})
};


module.exports = ConfigSaveService;