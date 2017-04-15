import * as http from 'http';
import * as path from 'path';
import * as express from 'express';
import * as session from 'express-session';
import * as bodyParser from 'body-parser';
import * as cookieParser from 'cookie-parser';
import * as serveStatic from 'serve-static';
import jpo from './';

const app = express();

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

jpo.bootstrap(app)
  .then(() => http.createServer(app).listen(10000));
