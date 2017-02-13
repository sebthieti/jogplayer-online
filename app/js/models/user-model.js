'use strict';

jpoApp.factory('UserModel', ['jpoModelBuilder', function(jpoModelBuilder) {
	var userSchema = {
		id: String, // TODO Import ObjectId ?
		username: String,
		email: String,
		password: String,
		role: String,
		fullName: String,
		isAdmin: Boolean, // TODO Remove this later
		isRoot: Boolean, // TODO Remove this later
		canWrite: Boolean, // TODO Remove this later
		permissions: {
			canWrite: Boolean,
			isAdmin: Boolean,
			isRoot: Boolean,
			allowPaths: [ String ],
			allowedPaths: [ String ], // TODO To be removed
			denyPaths: [ String ],
			homePath: String,
			links: [{ href: String, rel: String }]
		},
		links: [{ href: String, rel: String }],
		methods: { }
	};

	return jpoModelBuilder.model('users', userSchema);
}]);