'use strict';

if (!window.Jpo) {
	window.Jpo = {};
}

window.Jpo.PlayerState = {
	Unknown: '',
	Error: 'error',
	PlayFirst: 'first',
	Pause: 'paused',
	Stop: 'stop',
	Play: 'play',
	Previous: 'previous',
	Next: 'next',
	Ended: 'ended'
};


window.Jpo.ButtonMap = {
	Left: 0
};