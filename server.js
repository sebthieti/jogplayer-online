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
app.use(express.static(path.join(process.cwd(), 'app')));

var server = http.createServer(app);
var io = socketio.listen(server);

infrastructure.init(app, io);

server.listen(10000);