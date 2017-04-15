import * as util from 'util';
import {MongoClient, Db, Collection} from 'mongodb';
import {EventEmitter} from 'events';
import {IEvents} from '../events/index';
import {IDbConfig} from '../services/config.service';

export interface IMongoDbContext extends EventEmitter {
  users: Collection;
  media: Collection;
}

export class MongoDbContext extends EventEmitter implements IMongoDbContext {
  users: Collection;
  media: Collection;
  private db: Db;

  constructor(events: IEvents) {
    super();

    process.once('exit', this.disconnect.bind(this));
    process.once('SIGINT', this.disconnect.bind(this));

    // TODO Will die, as the app shouldn't bootstrap db, and Config should be injected
    events.onConfigReady(config => this.connectAndSetContext(config));
  }

  private connectAndSetContext(config: {DbConnection: IDbConfig}) {
    const db = config.DbConnection;
    const dbConnectionString = util.format(
      'mongodb://%s:%d/%s',
      db.host,
      db.port,
      db.dbName
    );

    // TODO use Promise instead
    MongoClient.connect(
      dbConnectionString,
      (error: MongoError, db: Db) => !error && this.setContextAndNotify(db)
    );
  }

  private setContextAndNotify(db: Db) {
    this.users = db.collection('users');
    this.media = db.collection('media');

    this.emit('db.ready');
  }

  private disconnect() {
    return this.db.close();
  }
}
