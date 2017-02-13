'use strict';

var http = require('http'),
	path = require('path'),
	express = require('express'),
	session = require('express-session'),
	bodyParser = require('body-parser'),
	cookieParser = require('cookie-parser'),
	serveStatic = require('serve-static'),
	infrastructure = require('./infrastructure');

var app = express();

app.set('view engine', 'vash');
app.set('views', path.join(process.cwd(), 'app'));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(session({
	resave: false,
	saveUninitialized: false,
	secret: 'keyboard cat', // TODO Secret s/b env like env.get("SESSION_SECRET"),
	cookie: {
		maxAge: 2678400000 // 31 days
	}
}));
app.use(serveStatic(path.join(process.cwd(), 'app')));

var server = http.createServer(app);

infrastructure.init(app);

server.listen(10000);
