'use strict';

jpoApp.factory('FileModel', ['jpoModelBuilder', 'Model', function(jpoModelBuilder, Model) {
	var linkHelpers = Helpers.linkHelpers;

	var fileSchema = {
		name: String,
		type: String,
		links: [{ href: String, rel: String }],
		methods: {
			selectSelfPlayFromLinks: function () {
				return linkHelpers.selectActionFromLinks('self.play', this.links);
			},
			selectSelfPhysicalFromLinks: function () {
				return linkHelpers.selectActionFromLinks('self.phys', this.links);
			},
			getMediumFromLinkUrl: function(mediumLinkUrl) {
				var self = this;
				return this.service
					.getByLinkAsync(mediumLinkUrl)
					.then(function(rawMedium) {
						self.validateSchema(rawMedium, self.schema);
						var mediumModel = Model.build(self.endpointName, self.schema, rawMedium);
						return mediumModel;
					});
			}
		}
	};

	return jpoModelBuilder.model('explore', fileSchema);
}]);