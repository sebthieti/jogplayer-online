'use strict';

jpoApp.factory('UserModel', ['jpoModelBuilder', function(jpoModelBuilder) {
	var userSchema = {
		id: String, // TODO Import ObjectId ?
		username: String,
		email: String,
		role: String,
		fullName: String,
		isAdmin: Boolean,
		isRoot: Boolean,
		canWrite: Boolean,
		permissions: [ String ],
		links: [{ href: String, rel: String }],
		methods: { }
	};

	return jpoModelBuilder.model('Users', userSchema);
}]);