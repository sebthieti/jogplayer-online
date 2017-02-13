/// This file is temporary and will be removed soon

'use strict';

jpoApp.factory('mediators', function() {
	var isUserStateInitialized = false;

	return {
		getIsUserStateInitialized: function() {
			return isUserStateInitialized;
		},
		setIsUserStateInitialized: function(value) {
			isUserStateInitialized = value;
		}
	}
});
