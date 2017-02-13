'use strict';

jpoApp.factory('FavoriteModel', ['jpoModelBuilder', function(jpoModelBuilder) {
	var favoriteSchema = {
		id: String, // TODO Import ObjectId ?
		name: String,
		index: Number,
		folderPath: String,
		links: [{ href: String, rel: String }],
		methods: {
			selectTargetLinkUrlFromLinks: function () {
				return Helpers.Link.selectActionFromLinks('target', this.links);
			},
			createEntity: function(name, folderPath, index) {
				return {
					name: name,
					folderPath: folderPath,
					index: index
				};
			}
		}
	};

	return jpoModelBuilder.model('favorites', favoriteSchema);
}]);