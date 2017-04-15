import * as jsonfile from 'jsonfile';
import {MongoClient, Db, Collection} from 'mongodb';
import {EventEmitter} from 'events';
import {nfcall} from '../utils/promiseHelpers';
import * as path from 'path';

interface IDbConfig {
  connection: string;
}

export interface IMongoDbContext extends EventEmitter {
  users: Collection;
  media: Collection;
}

export class MongoDbContext extends EventEmitter implements IMongoDbContext {
  users: Collection;
  media: Collection;
  private db: Db;

  constructor() {
    super();

    process.once('exit', () => this.disconnect.bind(this));
    process.once('SIGINT', () => this.disconnect.bind(this));

    this.connectAndSetContext();
  }

  private async connectAndSetContext(): Promise<void> {
    const dbConfig = await nfcall<IDbConfig>(
      jsonfile.readFile,
      path.join(process.cwd(), 'config/dbConfig.json')
    );

    this.db = await MongoClient.connect(dbConfig.connection);
    this.setContextAndNotify(this.db);
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
