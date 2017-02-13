'use strict';

jpoApp.factory('UserStateModel', ['jpoModelBuilder', 'Model', function(jpoModelBuilder, Model) {
	var userStateSchema = {
		playedPosition: Number,
		mediaQueue: [ String ],
		browsingFolderPath: String,
		openedPlaylistId: String,
		playingMediumInQueueIndex: Number,
		links: [{ href: String, rel: String }],
		methods: {
			getCurrentUserStateAsync: function() {
				var self = this;
				return this.service
					.getFromRelativeUrlAsync('current-user-state')
					.then(function(rawUserState) {
						if (rawUserState) {
							self.validateSchema(rawUserState, self.schema);
							return Model.build(self.endpointName, self.schema, rawUserState);
						}
						return null;
					});
			},
			createEmptyUserStateEntity: function() {
				return {
					playedPosition: 0,
					mediaQueue: [],
					browsingFolderPath: '',
					openedPlaylistId: '',
					playingMediumInQueueIndex: 0,
					setPlayedPosition: function(pos) {
						this.playedPosition = pos;
						return this;
					},
					setMediaQueue: function(mediaQueue) {
						this.mediaQueue = mediaQueue;
						return this;
					},
					setBrowsingFolderPath: function(browsingFolderPath) {
						this.browsingFolderPath = browsingFolderPath;
						return this;
					}
				};
			}
		}
	};

	return jpoModelBuilder.model('user-states', userStateSchema);
}]);