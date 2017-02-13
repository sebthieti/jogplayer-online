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
				var ctxMediumQueueVm = null;

				audioPlayerControl.init({
					setCurrentStateHandler: function(state) {
						audioPlayerBusiness.playStateChanged(state);
					},
					setCurrentMediumHandler: function(mediumModel) { // TODO Revamp ?
						audioPlayerBusiness.setCurrentMedium(ctxMediumQueueVm);
					},
					setCurrentVolume: function(volume) {
						audioPlayerBusiness.volumeChanged(volume);
					},
					controlDomElement: $window.document
				});

				audioPlayerBusiness.init({
					setUpdateVolumeHandler: function(vol) {
						audioPlayerControl.setVolumeFromCode(vol);
					},
					setMediumHandler: function(mediumQueueVm) {
						ctxMediumQueueVm = mediumQueueVm;
						audioPlayerControl.setMediumToPlayAndPlay(ctxMediumQueueVm.model);
					},
					setMediumPositionHandler: function(position) {
						audioPlayerControl.setMediumTimePosition(position);
					},
					playFirstHandler: function() {

					},
					playNextHandler: function playNext() {

					},
					playPreviousHandler: function() {

					},
					//playMediumHandler: function(mediumToPlay) {
					//	audioPlayerControl.playMedium(mediumToPlay);
					//},
					stopHandler: function() {
						audioPlayerControl.stopMedium();
					},
					playHandler: function() {
						audioPlayerControl.playMedium();
					},
					setMediumAndSetCursorAt: function(mediumQueueVm, position) {
						ctxMediumQueueVm = mediumQueueVm;
						audioPlayerControl.setMediumToPlay(mediumQueueVm.model);
						audioPlayerControl.setMediumTimePosition(position);
						audioPlayerControl.playOrPause();
					}
				});

				$scope.playNext = function() {
					audioPlayerBusiness.playNext();
				};

				$scope.playPrevious = function() {
					audioPlayerBusiness.playPrevious();
				};

				$scope.playOrPause = function() {
					if (audioPlayerControl.getState() === PlayerState.Unknown) {
						audioPlayerBusiness.playFirst();
					} else {
						audioPlayerControl.playOrPause();
					}
				};

				//audioPlayerControl
				//	.observeCurrentState()
				//	.do(function(currentState) {
				//		switch (currentState) {
				//			case PlayerState.Ended:
				//				audioPlayerBusiness.playEnded();
				//				break;
				//			case PlayerState.Error:
				//				audioPlayerBusiness.mediumError();
				//				break;
				//		}
				//	})
				//	.silentSubscribe();

				audioPlayerControl
					.observeMediumPosition()
					.do(function(pos) {
						audioPlayerBusiness.mediumPositionChanged(pos);
					})
					.silentSubscribe();

				//audioPlayerControl
				//	.observeCurrentState()
				//	.do(function(state) {
				//		audioPlayerBusiness.playStateChanged(state);
				//	})
				//	.silentSubscribe();

				//audioPlayerBusiness
				//	.observeMediumPosition()
				//	.where(function() {return !userUpdate})
				//	// where not called from a user notif
				//	.do(function(vol) {
				//		audioPlayerControl.setMediumTimePosition(vol);
				//	})
				//	.silentSubscribe();



				//audioPlayerControl // From user change
				//	.observeVolume()
				//	.do(function(vol) {
				//		//userUpdate = true;
				//		audioPlayerBusiness.volumeChanged(vol);
				//		//userUpdate = false;
				//		//audioPlayerControl.setVolumeFromControl(vol);
				//	})
				//	.silentSubscribe();

				//audioPlayerBusiness
				//	.observeVolume()
				//	.where(function() {return !userUpdate})
				//	// where not called from a user notif
				//	.do(function(vol) {
				//		audioPlayerControl.setVolumeFromCode(vol);
				//	})
				//	.silentSubscribe();

				//audioPlayerBusiness
				//	.observePlayingMedium()
				//	.select(function(x) {return x.model})
				//	.do(function(mediumToPlay) {
				//		audioPlayerControl.playMedium(mediumToPlay);
				//	})
				//	.silentSubscribe();

				//audioPlayerBusiness
				//	.getAndObservePlayControl()
				//	.where(function(state) {
				//		return state === PlayerState.Stop;// && _currentState !==  '';
				//	})
				//	.do(function(playState) {
				//		switch (playState) {
				//			case 'stop':
				//				audioPlayerControl.stopMedium();
				//				break;
				//		}
				//	})
				//	.silentSubscribe();

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