'use strict';

jpoApp.factory('jpoModelBuilder', ['Model', function(Model) {
	return {
		model: function(endpointName, schema) {
			var model = new Model(endpointName, schema);

			// Insert instance methods from schema
			for (var methodName in schema.methods) {
				if (!schema.methods.hasOwnProperty(methodName)) {
					continue;
				}
				model[methodName] = schema.methods[methodName];
			}

			return model;
		}
	}
}]);