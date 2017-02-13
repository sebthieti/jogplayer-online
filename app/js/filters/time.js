'use strict';

jpoApp.filter('time', function() {
	function getTimeFormatForDuration (timeInSeconds) {
		if (timeInSeconds < 3600) {
			return 'm:ss';
		}
		return 'H:mm:ss';
	}

	return function(timeInSeconds) {
		// Ensure valid type !

		var format = getTimeFormatForDuration(timeInSeconds);
		return (new Date)
			.clearTime()
			.addSeconds(timeInSeconds)
			.toString(format);
	}
});