'use strict';

var http = require('http'),
	path = require('path'),
	socketio = require('socket.io'),
	express = require('express'),
	infrastructure = require('./infrastructure');

var app = express();

app.set('view engine', 'vash');
app.set('views', path.join(process.cwd(), 'app'));

app.use(express.json());
//app.use(express.favicon());
//app.use(express.urlencoded());
app.use(express.cookieParser());
app.use(express.bodyParser());
app.use(express.session({
	secret: 'keyboard cat', // TODO Secret s/b env like env.get("SESSION_SECRET"),
	cookie: {
		maxAge: 2678400000 // 31 days
	}
}));
app.use(express.static(path.join(process.cwd(), 'app')));

var server = http.createServer(app);
var io = null;//socketio.listen(server);

infrastructure.init(app, io);

server.listen(10000);