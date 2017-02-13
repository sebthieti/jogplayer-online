'use strict';

jpoApp.factory('userSchema', function() {
	return {
		id: String, // TODO Import ObjectId ?
		isActive: Boolean,
		username: String,
		email: String,
		password: String,
		role: String,
		fullName: String,
		permissions: {
			canWrite: Boolean,
			isAdmin: Boolean,
			isRoot: Boolean,
			allowPaths: [ String ],
			denyPaths: [ String ],
			homePath: String,
			links: [{ href: String, rel: String }]
		},
		links: [{ href: String, rel: String }],
		methods: {
			selectBrowsingHomePathFromLinks: function () { // TODO s/b place on permissions, but methods doesn't work
				return Helpers.Link.selectActionFromLinks('self.browsingFolderPath', this.permissions.links)
			}
		}
	};
});

jpoApp.factory('LogUserModel', ['userSchema', 'Model', 'jpoModelBuilder', function(userSchema, Model, jpoModelBuilder) {
	var loginUserSchema = _.clone(userSchema);
	loginUserSchema.methods.login = function (username, password) { // TODO s/b place on permissions, but methods doesn't work
		var self = this;
		return this.service
			.addAsync({ username: username, password: password }, '/api/login')
			.then(function(savedEntity) {
				return Model.build(self.endpointName, self.schema, savedEntity);
			});
	};

	return jpoModelBuilder.model('login', loginUserSchema);
}]);

jpoApp.factory('AuthenticatedUserModel', ['userSchema', 'jpoModelBuilder', function(userSchema, jpoModelBuilder) {
	return jpoModelBuilder.model('is-authenticated', userSchema);
}]);

jpoApp.factory('UserModel', ['userSchema', 'jpoModelBuilder', function(userSchema, jpoModelBuilder) {
	return jpoModelBuilder.model('users', userSchema);
}]);