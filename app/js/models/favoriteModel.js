'use strict';

function getFunctionName(fn) {
	if (fn.name) {
		return fn.name.toLowerCase();
	}
	return (fn.toString().toLowerCase().trim().match(/^function\s*([^\s(]+)/) || [])[1];
}

jpoApp.factory('FileExplorerModel', ['jpoModelBuilder', 'Model', function(jpoModelBuilder, Model) {
	var fileExplorerSchema = {
		files: [{
			name: String,
			type: String,
			links: [{ href: String, rel: String }],
			methods: { }
		}],
		links: [{ href: String, rel: String }],
		methods: { }
	};
	//fileExplorerSchema.methods.getFolderContent = function(folderModel) { // TODO Send model instead ?
	fileExplorerSchema.methods.getFolderByLink = function(linkUrl) { // TODO Send model instead ?
		var self = this;

		return this.service
			.getByLinkAsync(linkUrl)
			.then(function(folderContent) {
				//self.validateArray(folderContent, self.schema); // TODO Work on this
				return Model.build(self.endpointName, self.schema, folderContent);
			});
	};
	fileExplorerSchema.methods.hasParentDir = function() {
		return angular.isDefined(this.selectParentDirFromLinks());
	};

	fileExplorerSchema.files[0].methods.isDirectory = function() {
		return this.type === 'D';
	};
	fileExplorerSchema.files[0].methods.isFile = function() {
		return this.type === 'F'
	};

	return jpoModelBuilder.model('explore', fileExplorerSchema);
}]);

jpoApp.factory('PlaylistMediaModel', ['jpoModelBuilder', 'Model', function(jpoModelBuilder, Model) {
	var playlistMediaSchema = {
		id: String,
		title: String,
		index: Number,
		isAvailable: Boolean,
		isChecked: Boolean,
		mimeType: String,
		duration: Number,
		ext: String,
		links: [{ href: String, rel: String }],
		methods: { }
	};
	playlistMediaSchema.methods.getMediaFrom = function(playlistModel) {
		var self = this;
		return this.service
			.getByLinkAsync(playlistModel.selectActionFromLinks('media', playlistModel.links))
			.then(function(rawMedia) {
				self.validateArray(rawMedia, self.schema);
				var mediaModels = Model.build(self.endpointName, self.schema, rawMedia);
				mediaModels.forEach(function(medium) {
					medium.playlistId = playlistModel.id;
				});
				return mediaModels;
			});
	};

	return jpoModelBuilder.model('playlists', playlistMediaSchema);
}]);

jpoApp.factory('PlaylistsModel', ['Model', 'jpoModelBuilder', function(Model, jpoModelBuilder) {
	var playlistsSchema = {
		id: String,
		name: String,
		index: Number,
		//filePath: String, // TODO Useless information
		isAvailable: Boolean,
		links: [ { href: String, rel: String } ],
		methods: { }
	};
	playlistsSchema.methods.addByFilePathAsync = function(playlistFile) {
		return this.addAsync({
			filePath: this.selectSelfPhysicalFromLinks(playlistFile.links)
		});
	};
	playlistsSchema.methods.addMediumByFilePathToPlaylist = function(mediaFilePath) {
		var self = this;
		return this.service
			.addByLinkAsync(
				this.selectActionFromLinks('media.insert'),
				{ index: 'end', mediaFilePath: mediaFilePath }
			)
			.then(function(mediumEntity) {
				return Model.build(self.endpointName, self.schema, mediumEntity);
			});
	};

	return jpoModelBuilder.model('playlists', playlistsSchema);
}]);

jpoApp.factory('FavoriteModel', ['jpoModelBuilder', function(jpoModelBuilder) {
	var favoriteSchema = {
		id: String, // TODO Import ObjectId ?
		name: String,
		index: Number,
		folderPath: String,
		links: [ { href: String, rel: String } ],
		methods: { }
	};
	favoriteSchema.methods.createEntity = function(name, folderPath, index) {
		return {
			name: name,
			folderPath: folderPath,
			index: index
		};
	};

	return jpoModelBuilder.model('favorites', favoriteSchema);
}]);

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

jpoApp.factory('Model', ['serviceProxy', function(serviceProxy) {
	function Model(endpointName, schema, entity) {
		this.service = serviceProxy.getServiceFor(endpointName);
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
		var model = new Model(endpointName, schema, entity);
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
			.then(function(favoriteEntity) {
				return Model.build(self.endpointName, self.schema, favoriteEntity);
			});
	};

	Model.prototype.removeAsync = function() {
		return this.service.removeAsync(
			this.selectActionFromLinks('remove', this.links)
		);
	};

	Model.prototype.addAsync = function(favorite) { // TODO Rename
		var self = this;
		return this.service
			.addAsync(favorite)
			.then(function(favoriteEntity) {
				return Model.build(self.endpointName, self.schema, favoriteEntity)
			});
	};

	Model.prototype.getUpdatedFields = function(original, updated) {
		var updatedFields = {};
		for (var key in original) {
			if (!original.hasOwnProperty(key)) {
				continue;
			}

			var originalValue = original[key];
			var updatedValue = updated[key];
			if (updatedValue !== originalValue){
				updatedFields[key] = updatedValue;
			}
		}
		return updatedFields;
	};

	Model.prototype.selectTargetLinkFromLinks = function () {
		var link = _.find(this.links, function (link) {
			return link.rel === 'target';
		});
		if (link) {
			return link;
		}
	};

	Model.prototype.selectSelfFromLinks = function () {
		return _.find(this.links, function (link) {
			return link.rel === 'self';
		}).href;
	};

	Model.prototype.selectSelfPhysicalFromLinks = function () {
		var link = _.find(this.links, function (link) {
			return link.rel === 'self.phys';
		});
		if (link) {
			return link.href;
		}
	};

	Model.prototype.selectParentDirFromLinks = function () { // TODO Should be only on FileExplorerModel ?
		var link = _.find(this.links, function (link) {
			return link.rel === 'parent';
		});
		if (link) {
			return link.href;
		}
	};

	Model.prototype.selectSelfPlayFromLinks = function () { // TODO Should be only on FileExplorerModel ?
		return _.find(this.links, function (link) {
			return link.rel === 'self.play';
		}).href;
	};

	Model.prototype.selectActionFromLinks = function (action) {
		var link = _.find(this.links, function (link) {
			return link.rel === action;
		});
		if (link) {
			return link.href;
		}
	};

	Model.prototype.validateArray = function (array, schema) {
		if (!Array.isArray(array)) {
			throw 'Not array';
		}
		_.forEach(array, function (fav) {
			this.validateSchema(fav, schema);
		}, this);
	};

	Model.prototype.validateSchema = function (entities, schema) {
		if (Array.isArray(entities)) {
			this.validateArray(entities, schema);
		} else {
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
					} else {

						if (typeof value === getFunctionName(type)) {
							continue; // Ok, there's a match, we both found the key and type is correct.
						} else {
							throw 'Type of ' + key + ' in DTO is unexpected';
						}
					}
				}
				throw '[Model].[Property]: [' + this.endpointName + '].[' + key + '] in DTO has not been found in schema';
			}
		}
	};

	return Model;
}]);