'use strict';

var Q = require('q'),
	UserStateDto = require('../dto').UserStateDto;

var _app,
	_userStateDirector,
	_routes,
	_authDirector;

var assertAndGetUserStateId = function (obj) {
	if (!obj || !obj.userStateId) {
		throw 'Id must be set.';
	}
	return obj.userStateId;
};

function UserStateController (app, routes, authDirector, userStateDirector) {
	_app = app;
	_routes = routes;
	_userStateDirector = userStateDirector;
	_authDirector = authDirector;
}

UserStateController.prototype.init = function() {
	_app.get(_routes.userStates.currentUserStatePath, _authDirector.ensureApiAuthenticated, function(req, res) {
		return _userStateDirector
			.getUserStateAsync(req.user)
			.then(function(data) { res.send(data) })
			.catch(function(err) { res.status(400).send(err) })
			.done();
	});

	_app.post(_routes.userStates.insertPath, _authDirector.ensureApiAuthenticated, function(req, res) {
		Q.fcall(UserStateDto.toDto, req.body)
		.then(function(dto) {
			return _userStateDirector.addUserStateAsync(dto, req.user);
		})
		.then(function(data) { res.send(data) })
		.catch(function(err) { res.status(400).send(err) })
		.done();
	});

	_app.patch(_routes.userStates.updatePath, _authDirector.ensureApiAuthenticated, function(req, res) {
		Q.fcall(assertAndGetUserStateId, req.params)
		.then(function (userStateId) {
			return {
				userStateId: userStateId,
				userStateDto: UserStateDto.toDto(req.body)
			};
		})
		.then(function (reqSet) {
			return _userStateDirector.updateFromUserStateDtoAsync( // TODO Maybe change method in save layer that uses dtos
				reqSet.userStateId,
				reqSet.userStateDto,
				req.user
			);
		})
		.then(function(data) { res.status(200).send(data) })
		.catch(function(err) { res.status(400).send(err) })
		.done();
	});

	//_app.delete(_routes.users.deletePath, _authDirector.ensureApiAuthenticated, function(req, res) {
	//	Q.fcall(assertAndGetUserStateId, req.params)
	//	.then(function(userId) {
	//		return _userStateDirector.removeUserByIdAsync(userId, req.user);
	//	})
	//	.then(function() { res.send(204) })
	//	.catch(function(err) { res.send(400, err) })
	//	.done();
	//});
};

module.exports = UserStateController;