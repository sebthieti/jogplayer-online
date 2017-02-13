'use strict';

if (!window.Jpo) {
	window.Jpo = {};
}

window.Jpo.PlayerState = { // TODO S/b renamed to event
	Unknown: '',
	Aborted: 'aborted',
	Error: 'error',
	PlayFirst: 'first',
	Pause: 'paused',
	Stop: 'stop',
	Play: 'play',
	Previous: 'previous',
	Next: 'next',
	Ended: 'ended',
	TimeUpdate: 'time-update',
	DurationChange: 'duration-change',
	Progress: 'progress',
	MediumSet: 'medium-set',
	MediumLoaded: 'medium-loaded',
	Volume: 'volume'
};

window.Jpo.ButtonMap = {
	Left: 0
};