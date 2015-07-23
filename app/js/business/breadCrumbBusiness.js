'use strict';

jpoApp.factory('breadCrumbPlaylistExplorerBusiness', [
	'breadCrumbBusinessFactory',
	function(breadCrumbBusinessFactory) {
		return breadCrumbBusinessFactory.buildBreadCrumbForPlaylistExplorerBusiness();
	}
]).factory('breadCrumbFileExplorerBusiness', [
	'breadCrumbBusinessFactory',
	function(breadCrumbBusinessFactory) {
		return breadCrumbBusinessFactory.buildBreadCrumbForFileExplorerBusiness();
}]).factory('breadCrumbBusinessFactory', [
	'playlistExplorerBusiness',
	'fileExplorerBusiness',
	function(playlistExplorerBusiness, fileExplorerBusiness) {

		function BreadCrumbBusiness(business) {

			function observeCurrentDir() {
				return business
					.observeCurrentFolderContent()
					.select(function(folderContentVm) {
						return folderContentVm.links;
					});
			}

			function changeDir(folderPath) {
				var folderApiLink = '/api/explore' + folderPath;
				business.changeFolderByApiLinkAndResetSelection(folderApiLink);
			}

			return {
				observeCurrentDir: observeCurrentDir,
				changeDir: changeDir
			};
		}

		return {
			buildBreadCrumbForFileExplorerBusiness: function() {
				return new BreadCrumbBusiness(fileExplorerBusiness);
			},

			buildBreadCrumbForPlaylistExplorerBusiness: function() {
				return new BreadCrumbBusiness(playlistExplorerBusiness);
			}
		};
}]);
