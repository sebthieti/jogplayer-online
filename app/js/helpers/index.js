window.Helpers = {
	Link: {
		// TODO Extension method
		selectTargetLinkFromLinks: function (links) {
			var link = _.find(links, function (link) {
				return link.rel === 'target';
			});
			if (link) {
				return link;
			}
		},

		selectSelfFromLinks: function (links) {
			return _.find(links, function (link) {
				return link.rel === 'self';
			}).href;
		},

		selectSelfPhysicalFromLinks: function (links) {
			var link = _.find(links, function (link) {
				return link.rel === 'self.phys';
			});
			if (link) {
				return link.href;
			}
		},

		selectParentDirFromLinks: function (links) {
			var link = _.find(links, function (link) {
				return link.rel === 'parent';
			});
			if (link) {
				return link.href;
			}
		},

		selectSelfPlayFromLinks: function(links) {
			return _.find(links, function(link) {
				return link.rel === 'self.play';
			}).href;
		},

		selectActionFromLinks: function(action, links) {
			var link = _.find(links, function(link) {
				return link.rel === action;
			});
			if (link) {
				return link.href;
			}
		}
	},

	MediumSourceTag: {
		build: function(url, overrideExt) {
			var extIndex = url.lastIndexOf(".");
			var mediumExt = url.substring(extIndex);
			var ext = overrideExt || mediumExt;

			var srcTag = document.createElement('source');
			srcTag.id = "src_" + ext.substring(1);
			srcTag.src = this._buildUrl(url, overrideExt);
			var mimeType = this._getMimeTypeFromExt(ext);
			if (mimeType) {
				srcTag.type = mimeType;
			}

			return srcTag;
		},

		_getMimeTypeFromExt: function(ext) {
			var mimeType = null;
			switch(ext) {
				case '.mp1':
				case '.mp2':
				case '.mp3':
				case '.mpg':
				case '.mpeg':
					mimeType = 'audio/mpeg';
					break;
				case '.oga':
				case '.ogg':
					mimeType = 'audio/ogg';
					break;
				case '.mp4':
				case '.m4a':
					mimeType = 'audio/mp4';
					break;
				case '.aac':
					mimeType = 'audio/aac';
					break;
				case '.wav':
					mimeType = 'audio/wav';
					break;
				case '.webm':
					mimeType = 'audio/webm';
					break;
				case '.flac':
					mimeType = 'audio/flac';
					break;
			}
			return mimeType;
		},

		_buildUrl: function(original, overrideExt) {
			if (!overrideExt) {
				return original;
			}
			return original.substring(0, original.lastIndexOf(".")) +
				overrideExt;
		}
	}
};