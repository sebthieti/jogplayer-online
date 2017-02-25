import * as fs from 'fs';
import * as path from 'path';

import {nfcall} from '../utils/promiseHelpers';
import {IEvents} from '../events/index';

export interface IConfigService {
  checkFileConfigExistsAsync();
  setDbConfigAsync(config);
  setDbConfigForTestsAsync(config);
}

export default class ConfigService implements IConfigService {
  constructor(private events: IEvents) {
    this.checkFileConfigExistsAsyncAndSetSubject();
  }

  checkFileConfigExistsAsync() {
    return nfcall(
      fs.open,
      path.join(process.cwd(), 'config/default.json'),
      'r'
    )
    .then(fd => nfcall(fs.close, fd))
    .then(() => true)
    .catch(() => false); // Error means file doesn't exists
  }

  setDbConfigAsync(config) {
    return this.setDbConfigWithConfigAsync(config, 'config/default.json');
  }

  setDbConfigForTestsAsync(config) {
    return this.setDbConfigWithConfigAsync(config, 'config/unit-tests.json');
  }

  private checkFileConfigExistsAsyncAndSetSubject() {
    return this
      .checkFileConfigExistsAsync()
      .then(exists => {
        if (exists) {
          this.events.emitConfigReady(require('config')); // TODO can we use something else than require?
        }
      });
  }

  private setDbConfigWithConfigAsync(config, configPath) {
    return nfcall(
      fs.writeFile,
      path.join(process.cwd(), configPath),
      this.buildJsonConfig(config)
    )
    .then(() =>
      this.events.emitConfigReady(require('config')) // TODO can we use something else than require?
    );
  }

  private buildJsonConfig(config) {
    return JSON.stringify({
      DbConnection: {
        host: config.host,
        port: config.port,
        dbName: config.dbName
      }
    });
  }
}
