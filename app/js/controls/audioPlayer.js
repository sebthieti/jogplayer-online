'use strict';

jpoApp.directive("audioPlayer", [
	'$window',
	'AudioPlayerControl',
	'audioPlayerBusiness',
	function ($window, AudioPlayerControl, audioPlayerBusiness) {
		var PlayerState = Jpo.PlayerState;

		var audioPlayerControl = new AudioPlayerControl({
			audioPlayer: 'audioPlayer',
			elapsedTime: 'elapsed-time',
			remainingTime: 'remaining-time',
			loadedChunks: 'loaded-chunks',
			timeLineContainer: 'time-line-container',
			timeLine: 'time-line',
			volumeBar: 'volume-bar',
			volumeBarContainer: 'volume-bar-container',
			cursor: 'cursor',
			btnPlay: 'btnPlay'
		});

		return {
			restrict: 'E',
			replace: true,
			templateUrl: '/templates/controls/audioPlayer.html',
			controller: function($scope) {
				audioPlayerControl.init($window.document);

				$scope.playNext = function() {
					audioPlayerBusiness.playNext();
				};

				$scope.playPrevious = function() {
					audioPlayerBusiness.playPrevious();
				};

				$scope.playOrPause = function() {
					audioPlayerControl.observeCurrentState().getValueAsync(function(currentState) {
						if (currentState === PlayerState.Unknown) {
							audioPlayerBusiness.playFirst();
						} else {
							audioPlayerControl.playOrPause();
						}
					});
				};

				audioPlayerControl
					.observeCurrentState()
					.do(function(currentState) {
						switch (currentState) {
							case PlayerState.Ended:
								audioPlayerBusiness.playEnded();
								break;
							case PlayerState.Error:
								audioPlayerBusiness.mediumError();
								break;
						}
					})
					.silentSubscribe();

				audioPlayerControl
					.observeMediumPosition()
					.do(function(pos) {
						audioPlayerBusiness.setMediumPosition(pos);
					})
					.silentSubscribe();

				audioPlayerControl
					.observeVolume()
					.do(function(volume) {
						audioPlayerBusiness.setVolume(volume);
					})
					.silentSubscribe();

				audioPlayerBusiness
					.observePlayingMedium()
					.select(function(x) {return x.model})
					.do(function(mediumToPlay) {
						audioPlayerControl.playMedium(mediumToPlay);
					})
					.silentSubscribe();

				audioPlayerBusiness
					.getAndObservePlayControl()
					.where(function(state) {
						return state === PlayerState.Stop;// && _currentState !==  '';
					})
					.do(function(playState) {
						switch (playState) {
							case 'stop':
								audioPlayerControl.stopMedium();
								break;
						}
					})
					.silentSubscribe();

	//			var sendPlayableMediaTypes = function() {
	//				var audioTypes = [
	//					'audio/mp4',
	//					'audio/mpeg',
	//					'audio/ogg',
	//					"audio/ogg; codecs='flac'",
	//					"audio/x-flac",
	//					'audio/vorbis',
	//					"audio/ogg; codecs='vorbis'",
	//					"audio/ogg; codecs='opus'",
	//					'audio/opus',
	//					'audio/wav',
	//					'audio/vnd.wave'
	//				];
	//				var audioPlayer = _audioPlayerElements.audioPlayer;
	//				var playableTypes = {};
	//				_.each(audioTypes, function(audioType){
	//					return this[audioType] = audioPlayer.canPlayType(audioType)
	//				}, playableTypes);
	//			};
			}
		};
}]);