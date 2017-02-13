'use strict';

var Q = require('q'),
	Dto = require('../dto'),
	UserDto = Dto.UserDto,
	UserPermissionsDto = Dto.UserPermissionsDto;

var _app,
	_userDirector,
	_routes,
	_authDirector;

var assertAndGetUserId = function (obj) {
	if (!obj || !obj.userId) {
		throw new Error('Id must be set.');
	}
	return obj.userId;
};

function UserController(app, routes, authDirector, userDirector) {
	_app = app;
	_routes = routes;
	_userDirector = userDirector;
	_authDirector = authDirector;
}

UserController.prototype.init = function() {
	registerUserRoutes();
	registerUserPermissionsRoutes();
};

function registerUserRoutes() {
	_app.get(_routes.users.getPath, _authDirector.ensureApiAuthenticated, function(req, res) {
		_userDirector
			.getUsersAsync(req.user)
			.then(function(data) { res.send(data) })
			.catch(function(err) { res.status(400).send(err) })
			.done();
	});

	_app.post(_routes.users.insertPath, _authDirector.ensureApiAuthenticated, function(req, res) {
		Q.fcall(UserDto.toDto, req.body)
			.then(function(dto) {
				return _userDirector.addUserAsync(dto, req.user);
			})
			.then(function(data) { res.send(data) })
			.catch(function(err) { res.status(400).send(err) })
			.done();
	});

	_app.patch(_routes.users.updatePath, _authDirector.ensureApiAuthenticated, function(req, res) {
		Q.fcall(assertAndGetUserId, req.params)
			.then(function (userId) {
				return {
					userId: userId,
					user: UserDto.toDto(req.body, userId)
				};
			})
			.then(function (reqSet) {
				return _userDirector.updateFromUserDtoAsync( // TODO Maybe change method in save layer that uses dtos
					reqSet.userId,
					reqSet.user,
					req.user
				);
			})
			.then(function(data) { res.status(200).send(data) })
			.catch(function(err) { res.status(400).send(err) })
			.done();
	});

	_app.delete(_routes.users.deletePath, _authDirector.ensureApiAuthenticated, function(req, res) {
		Q.fcall(assertAndGetUserId, req.params)
			.then(function(userId) {
				return _userDirector.removeUserByIdAsync(userId, req.user);
			})
			.then(function() { res.sendStatus(204) })
			.catch(function(err) { res.status(400).send(err) })
			.done();
	});
}

function registerUserPermissionsRoutes() {
	_app.get(_routes.userPermissions.getPath, _authDirector.ensureApiAuthenticated, function(req, res) {
		Q.fcall(assertAndGetUserId, req.params)
			.then(function(userId) {
				return _userDirector.getUserPermissionsByUserId(userId, req.user);
			})
			.then(function(data) { res.send(data) })
			.catch(function(err) { res.status(400).send(err) })
			.done();
	});

	_app.patch(_routes.userPermissions.updatePath, _authDirector.ensureApiAuthenticated, function(req, res) {
		Q.fcall(assertAndGetUserId, req.params)
			.then(function (userId) {
				return {
					userId: userId,
					userPermissions: UserPermissionsDto.toDto(req.body, userId)
				};
			})
			.then(function (reqSet) {
				return _userDirector.updateUserPermissionsByUserIdAsync( // TODO Maybe change method in save layer that uses dtos
					reqSet.userId,
					reqSet.userPermissions,
					req.user
				);
			})
			.then(function(data) {
				res.status(200).send(data) })
			.catch(function(err) {
				res.status(400).send(err)
			})
			.done();
	});
}

module.exports = UserController;