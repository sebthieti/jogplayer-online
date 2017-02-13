'use strict';

var _userSaveService;

function UserDirector (userSaveService) {
	_userSaveService = userSaveService;
}
// TODO Check for rights before doing (directory should do not service layer)
UserDirector.prototype.getUsersAsync = function(owner) {
	if (owner.role !== 'admin') {
		throw 'Not authorized no manage users.';
	}
	return _userSaveService.getUsersAsync();
};

UserDirector.prototype.addUserAsync = function(user, owner) {
	if (owner.role !== 'admin') { // TODO Use role or isAdmin ? There is redundancy
		throw 'Not authorized no manage users.';
	}
	return _userSaveService.addUserAsync(user, owner);
};

UserDirector.prototype.updateFromUserDtoAsync = function(userId, userDto, owner) {
	if (owner.role !== 'admin') {
		throw 'Not authorized no manage users.';
	}
	return _userSaveService.updateFromUserDtoAsync(userId, userDto, owner);
};

UserDirector.prototype.removeUserByIdAsync = function(userId, currentUser) {
	if (currentUser.role !== 'admin') {
		throw 'Not authorized no manage users.';
	}

	return _userSaveService
		.getUserByIdAsync(userId)
		.then(function(user) {
			if (user.isRoot === true) {
				throw 'Root user cannot be removed.';
			}
			return _userSaveService.removeUserByIdAsync(user, currentUser);
		});
};

module.exports = UserDirector;