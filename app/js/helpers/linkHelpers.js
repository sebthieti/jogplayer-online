window.Helpers = {
	linkHelpers: {
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
	}
};