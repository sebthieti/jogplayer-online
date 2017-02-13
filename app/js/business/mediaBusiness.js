'use strict';

jpoApp.factory('mediaBusiness', function() {

	var mediaSelectionSubject = new Rx.BehaviorSubject();

	var getAndObserveHasMediaSelection = function() {
		return observeMediaSelection()
			.select(function(mediaSelection) {
				return _.any(mediaSelection);
			})
			.startWith(false);
	};

	var observeMediaSelection = function() {
		return mediaSelectionSubject.whereIsDefined();
	};

	var changeMediaSelection = function(media) {
		mediaSelectionSubject.onNext(media);
	};

	return {
		getAndObserveHasMediaSelection: getAndObserveHasMediaSelection,
		observeMediaSelection: observeMediaSelection,
		changeMediaSelection: changeMediaSelection
	}
});