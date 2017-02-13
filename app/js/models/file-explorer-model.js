'use strict';

jpoApp.factory('FileExplorerModel', ['jpoModelBuilder', 'Model', function(jpoModelBuilder, Model) {
	var linkHelpers = Helpers.Link;

	var fileExplorerSchema = {
		files: [{
			name: String,
			type: String,
			links: [{ href: String, rel: String }],
			methods: {
				isDirectory: function() {
					return this.type === 'D';
				},
				isFile: function() {
					return this.type === 'F'
				},
				selectSelfPlayFromLinks: function () {
					return linkHelpers.selectActionFromLinks('self.play', this.links);
				},
				selectSelfPhysicalFromLinks: function () {
					return linkHelpers.selectActionFromLinks('self.phys', this.links);
				}
			}
		}],
		links: [{ href: String, rel: String }],
		methods: {
			hasParentDir: function() {
				return angular.isDefined(this.selectParentDirFromLinks());
			},
			selectParentDirFromLinks: function () {
				return linkHelpers.selectActionFromLinks('parent', this.links);
			},
			selectSelfPhysicalFromLinks: function () {
				return linkHelpers.selectActionFromLinks('self.phys', this.links);
			},
			getFolderByLink: function(linkUrl) {
				var self = this;

				return this.service
					.getByLinkAsync(linkUrl)
					.then(function(folderContent) {
						//self.validateArray(folderContent, self.schema); // TODO Work on this
						return Model.build(self.endpointName, self.schema, folderContent);
					});
			}
		}
	};

	return jpoModelBuilder.model('explore', fileExplorerSchema);
}]);