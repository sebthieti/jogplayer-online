'use strict';

jpoApp.factory('PlaylistsModel', ['Model', 'jpoModelBuilder', function(Model, jpoModelBuilder) {
	var playlistsSchema = {
		id: String,
		name: String,
		index: Number,
		isAvailable: Boolean,
		links: [ { href: String, rel: String } ],
		methods: {
			addByFilePathAsync: function(playlistModel) {
				return this.addAsync({
					filePath: playlistModel.selectSelfPhysicalFromLinks()
				});
			},
			addMediumByFilePathToPlaylist: function(mediaFilePath) {
				var self = this;
				return this.service.addByLinkAsync(
					this.selectActionFromLinks('media.insert'),
					{ index: 'end', mediaFilePath: mediaFilePath }
				)
				.then(function(mediumEntity) {
					return Model.build(self.endpointName, self.schema, mediumEntity);
				});
			},
			insertMediumByFilePathToPlaylist: function(mediaFilePath, index) {
				var self = this;
				return this.service.addByLinkAsync(
					this.selectActionFromLinks('media.insert'),
					{ index: index, mediaFilePath: mediaFilePath }
				)
				.then(function(mediumEntity) {
					return Model.build(self.endpointName, self.schema, mediumEntity);
				});
			}
		}
	};

	return jpoModelBuilder.model('playlists', playlistsSchema);
}]);