'use strict';

var Q = require('q'),
	hasher = require('../utils/hasher');

var _userSaveService;

function AuthDirector(userSaveService) {
	_userSaveService = userSaveService;
}

AuthDirector.prototype.verifyUser = function(username, password, next) {
	_userSaveService
		.getUserByUsernameAsync(username)
		.then(function(user) {
			if (user === null) {
				next(null, false, { message: 'Invalid credentials.' });
				return;
			}
			var hashedPassword = hasher.computeHash(password, user.passwordSalt);
			if (user.password === hashedPassword) {
				next(null, user);
			} else {
				next(null, false, { message: 'Invalid credentials.' });
			}
		}, function(err) {
			next(err);
		});
};

AuthDirector.prototype.getUserByUsernameAsync = function(username) {
	return _userSaveService.getUserByUsernameAsync(username);
};

AuthDirector.prototype.serializeUser = function(user, next) {
	next(null, user.username);
};

AuthDirector.prototype.deserializeUser = function(username, next) {
	this.getUserByUsernameAsync(username) // TODO Really need of cache to avoid exessive queries
		.then(function(user) {
			next(null, user);
		}, function(err) {
			next(err, false, { message: err });
		});
};

AuthDirector.prototype.ensureApiAuthenticated = function(req, res, next) {
	if (req.isAuthenticated()) {
		next();
	} else {
		res.send(401);
	}
};

module.exports = AuthDirector;