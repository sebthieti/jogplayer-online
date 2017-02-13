'use strict';

jpoApp.factory('PlaylistMediaModel', ['jpoModelBuilder', 'Model', function(jpoModelBuilder, Model) {
	var linkHelpers = Helpers.linkHelpers;

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
		methods: {
			selectSelfPlayFromLinks: function () {
				return linkHelpers.selectActionFromLinks('self.play', this.links);
			},
			getMediaFrom: function(playlistModel) {
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
			},
			getMediumFromLinkUrl: function(mediumLinkUrl) {
				var self = this;
				return this.service
					.getByLinkAsync(mediumLinkUrl)
					.then(function(rawMedium) {
						self.validateSchema(rawMedium, self.schema);
						var mediumModels = Model.build(self.endpointName, self.schema, rawMedium);
						//mediaModels.forEach(function(medium) { // TODO What to do with that ?
						//	medium.playlistId = playlistModel.id;
						//});
						return mediumModels;
					});
			}
		}
	};

	return jpoModelBuilder.model('playlists', playlistMediaSchema);
}]);