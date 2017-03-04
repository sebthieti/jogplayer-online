import * as os from 'os';
import * as mongoose from 'mongoose';
import * as util from 'util';
import * as child_process from 'child_process';
import * as process from 'process';
import * as path from 'path';
import * as fs from 'fs';
import {IEvents} from '../events';
import {checkFileExistsAsync} from '../utils/fsHelpers';
import {nfcall} from '../utils/promiseHelpers';
import {IDbConfig} from '../services/config.service';

export interface IRepository {
  startDbService();
}

export default class Repository implements IRepository {
  private dbConnection;
  private dbProcess;

  constructor(private events: IEvents) {
    process.stdin.resume(); //so the program will not close instantly

    // Do something when app is closing
    process.on('exit', err => this.exitHandler({cleanup: true}, err));

    // Catches ctrl+c event
    process.on('SIGINT', err => this.exitHandler({exit: true}, err));

    // Catches uncaught exceptions
    process.on('uncaughtException', err => this.exitHandler({exit: true}, err));

    this.ensureDbFolderExists()
      .then(this.ensureLogFolderExists)
      .then(() => {
        this.startDbService();
        this.listenToConfigReadyAndInit();
      });
  }

  startDbService() {
    // Following is windows cfg
    this.dbProcess = child_process.spawn(
      this.getMongodExecRelativePath(), [
        '--config',
        this.getMongodConfigRelativePath()
      ], {
        cwd: this.getMongodCwdRelativePath()
      }
    );
    // TODO In linux all directory (logs/db data must exist before running script)

    this.dbProcess.stdout.on('data', data => {
      console.log(`stdout: ${data}`);
    });

    this.dbProcess.stderr.on('data', data => {
      console.log(`stderr: ${data}`);
    });

    this.dbProcess.on('close', code => {
      console.log('dbProcess process exited with code ' + code);
    });
  }

  private exitHandler(options: { cleanup?: boolean, exit?: boolean }, err: Error) {
    if (options.cleanup) {
      if (this.dbConnection) {
        this.dbConnection.disconnect();
      }
      if (this.dbProcess) {
        this.dbProcess.kill();
      }
    }
    if (err) console.log(err.stack);
    if (options.exit) process.exit();
  }

  private disconnectFromDb() {
    this.exitHandler({ cleanup: true }, null);
  }

  private ensureDbFolderExists(): Promise<void> {
    const dbPath = path.join(process.cwd(), './db/db/');
    return checkFileExistsAsync(dbPath)
      .then(folderExists => {
        if (!folderExists) {
          return nfcall(fs.mkdir, dbPath);
        }
      });
  }

  private ensureLogFolderExists(): Promise<void> {
    const dbPath = path.join(process.cwd(), './db/log/');
    return checkFileExistsAsync(dbPath)
      .then(folderExists => {
        if (!folderExists) {
          return nfcall(fs.mkdir, dbPath);
        }
      });
  }

  private getMongodExecRelativePath(): string {
    switch (os.platform()) {
      case 'win32':
        return '.\\bin\\mongod.exe';
      case 'linux':
      case 'darwin':
        return 'mongod';
      default:
        throw new Error(`The '${os.platform()}' system is not supported`);
    }
  }

  private getMongodConfigRelativePath(): string {
    return os.platform() === 'win32' ? 'mongod.conf' : './mongod-unix.conf';
  }

  private getMongodCwdRelativePath(): string {
    return os.platform() === 'win32' ? '.\\db' : './db/';
  }

  private listenToConfigReadyAndInit() {
    this.events.onConfigReady(config => {
      const timeout = os.platform() === 'win32' ? 0 : 5000;
      setTimeout(() => { // TODO In linux we need time before launch. Check for that
        this.initDbClient(config);

        this.events.emitDbConnectionReady();
      }, timeout);
    });
  }

  private initDbClient(config: {DbConnection: IDbConfig}) {
    const db = config.DbConnection;
    const dbConnectionString = util.format(
      'mongodb://%s:%d/%s',
      db.host,
      db.port,
      db.dbName
    );

    this.dbConnection = mongoose.connect(dbConnectionString);
  }
}
