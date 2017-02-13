'use strict';

jpoApp.factory('FileModel', ['jpoModelBuilder', 'Model', function(jpoModelBuilder, Model) {
	var linkHelpers = Helpers.Link;

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
			},

			createEntity: function(mediumPlayLinkUrl) {
				var self = this;
				return Model.build(self.endpointName, self.schema, {
					name: mediumPlayLinkUrl.substring(mediumPlayLinkUrl.lastIndexOf("/") + 1),
					type: "F",
					links:[{
							rel: "self",
							href: mediumPlayLinkUrl
						},{
							rel: "self.phys",
							href: mediumPlayLinkUrl.replace("/api/explore", "")
						},{
							rel: "self.play",
							href: "/api/media/play/path" + mediumPlayLinkUrl.replace("/api/explore", "")
						}] // TODO Get paths from svc repo
				});
			}
		}
	};

	return jpoModelBuilder.model('explore', fileSchema);
}]);