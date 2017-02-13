'use strict';

jpoApp.factory('PlaylistsModel', ['Model', 'jpoModelBuilder', function(Model, jpoModelBuilder) {
	var playlistsSchema = {
		id: String,
		name: String,
		index: Number,
		isAvailable: Boolean,
		links: [ { href: String, rel: String } ],
		methods: { }
	};
	playlistsSchema.methods.addByFilePathAsync = function(playlistModel) {
		return this.addAsync({
			filePath: playlistModel.selectSelfPhysicalFromLinks()
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