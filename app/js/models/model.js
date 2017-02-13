'use strict';

jpoApp.factory('Model', ['serviceFactory', function(serviceFactory) {
	function Model(endpointName, schema, entity) {
		this.service = serviceFactory.getServiceFor(endpointName);
		this.schema = schema;
		this.endpointName = endpointName;

		if (!entity) {
			return;
		}
		this.originalEntity = entity.clone();

		for (var key in entity) {
			if (!entity.hasOwnProperty(key)) {
				continue;
			}
			if (key !== 'links' && Array.isArray(entity[key])) {
				continue;
			}
			this[key] = entity[key];
		}
	}

	Model.prototype.getAllAsync = function() {
		var self = this;
		return this.service
			.getAsync()
			.then(function(entities) {
				self.validateSchema(entities, self.schema);
				return Model.build(self.endpointName, self.schema, entities);
			});
	};

	Model.build = function(endpointName, schema, entity) {
		// object mean one model def. : each prop s/b reflected
		//  -> if one is array: again def. of new model (recurse)
		// array means list of some (model)

		if (Array.isArray(entity)) {
			return buildStartArray(endpointName, schema, entity);
		} else {
			return buildStartObject(endpointName, schema, entity);
		}
	};

	function buildStartArray(endpointName, schema, entities) {
		return entities.map(function(entity) {
			return buildStartObject(endpointName, schema, entity);
		}, this);
	}

	function buildStartObject(endpointName, schema, entity) { //rootIsObject
		if (!angular.isObject(entity)) {
			return entity;
		}

		var model = new Model(endpointName, schema, entity);
		// Inject methods to model
		for (var methodName in schema) {
			if (!schema.hasOwnProperty(methodName)) {
				continue;
			}

			var propSchema = schema[methodName];
			if (Array.isArray(propSchema)) { // If schema prop. is array, drill down
				model[methodName] = buildStartArray(endpointName, propSchema, entity[methodName]);
			}
		}
		// TODO This is temp.
		var schemaMethods = Array.isArray(schema) ? schema[0].methods : schema.methods;
		for (var methodName in schemaMethods) {
			if (!schemaMethods.hasOwnProperty(methodName)) {
				continue;
			}

			model[methodName] = schemaMethods[methodName];
		}

		return model;
	}

	Model.prototype.updateAsync = function() {
		var updatedFields = this.getUpdatedFields(this.originalEntity, this);

		var self = this;
		return this.service
			.updateAsync(updatedFields, this.selectActionFromLinks('update', this.links))
			.then(function(savedEntity) {
				return Model.build(self.endpointName, self.schema, savedEntity);
			});
	};

	Model.prototype.removeAsync = function() {
		return this.service.removeAsync(
			this.selectActionFromLinks('remove', this.links)
		);
	};

	Model.prototype.addAsync = function(entity) {
		var self = this;
		return this.service
			.addAsync(entity)
			.then(function(savedEntity) {
				return Model.build(self.endpointName, self.schema, savedEntity)
			});
	};

	Model.prototype.getUpdatedFields = function(original, updated) {
		var updatedFields = {};
		for (var key in updated.schema) {
			if (key === 'links') {
				continue;
			}
			if (!updated.hasOwnProperty(key)) {
				continue;
			}
			// media: only ids in original, but nothing in updated
			var originalValue = original[key];
			var updatedValue = updated[key];
			if (!angular.equals(originalValue, updatedValue)){
				updatedFields[key] = updatedValue;
			}
		}
		return updatedFields;
	};

	Model.prototype.selectSelfFromLinks = function () {
		return Helpers.linkHelpers.selectActionFromLinks('self', this.links);
	};

	Model.prototype.selectActionFromLinks = function (action) {
		return Helpers.linkHelpers.selectActionFromLinks(action, this.links);
	};

	Model.prototype.validateArray = function (array, schema) {
		if (!array) {
			return;
		}
		if (!Array.isArray(array)) {
			throw 'Not array';
		}
		_.forEach(array, function (entity) {
			this.validateSchema(entity, schema);
		}, this);
	};

	Model.prototype.validateSchema = function (entities, schema) {
		if (Array.isArray(entities)) {
			this.validateArray(entities, schema);
		} else {

			if (angular.isObject(entities)) {
				// find for each field in obj, the schema name. Not present => throw invalid. bad time, same. other not desired => bad
				for (var key in entities) {
					if (!entities.hasOwnProperty(key)) {
						continue;
					}
					// Find key in schema to get type
					var type = schema[key];
					if (angular.isDefined(type)) {
						var value = entities[key];
						if (Array.isArray(type)) { // If schema prop. is array, drill down
							this.validateArray(value, _.first(type));
							continue;
						} else if (angular.isObject(value)) {
							this.validateSchema(value, type);
							continue;
						} else { // Neither array nor object, so native type
							if (typeof value === getFunctionName(type)) {
								continue; // Ok, there's a match, we both found the key and type is correct.
							} else {
								throw 'Type of ' + key + ' in DTO is unexpected';
							}
						}
					}
					throw '[Model].[Property]: [' + this.endpointName + '].[' + key + '] in DTO has not been found in schema';
				}
			} else {
				if (typeof entities !== getFunctionName(schema)) {
					throw '[Model].[Property]: [' + this.endpointName + '].[' + schema + '] in DTO has not been found in schema';
				}
			}
		}
	};

	return Model;
}]);

function getFunctionName(fn) {
	if (fn.name) {
		return fn.name.toLowerCase();
	}
	return (fn.toString().toLowerCase().trim().match(/^function\s*([^\s(]+)/) || [])[1];
}