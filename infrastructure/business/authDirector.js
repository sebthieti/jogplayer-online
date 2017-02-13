'use strict';

var hasher = require('../utils/hasher');

var _userProxy;

function AuthDirector(userProxy) {
	_userProxy = userProxy;
}

/**
 * @description
 *
 * Verify user credentials with given username and password. Provide a callback to retrieve response.
 * Response: (null, user|false, { message })
 *
 * @param {string} username User name to check for.
 * @param {string} password Password to check for.
 * @param {function} next A callback to be called to received response for check.
 */
AuthDirector.prototype.verifyUser = function(username, password, next) {
	_userProxy
		.getUserByUsernameWithPermissionsAsync(username)
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

/**
 * @description
 *
 * Retrieve user from cache by its username.
 *
 * @param {string} username User name to get user for.
 *
 * @returns {Promise} A promise returning an user
 */
AuthDirector.prototype.getUserByUsernameAsync = function(username) {
	return _userProxy.getUserByUsernameWithPermissionsAsync(username);
};

AuthDirector.prototype.serializeUser = function(user, next) {
	next(null, user.username);
};

AuthDirector.prototype.deserializeUser = function(username, next) {
	this.getUserByUsernameAsync(username) // TODO Really need of cache to avoid excessive queries
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
		res.sendStatus(401);
	}
};

module.exports = AuthDirector;
