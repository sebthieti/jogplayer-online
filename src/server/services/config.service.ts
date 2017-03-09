import * as fs from 'fs';
import * as path from 'path';

import {nfcall} from '../utils/promiseHelpers';
import {IEvents} from '../events/index';

export interface IDbConfig {
  host: string;
  port: string;
  dbName: string;
}

export interface IConfigService {
  checkFileConfigExistsAsync(): Promise<boolean>;
  setDbConfigAsync(config: IDbConfig): Promise<void>;
  setDbConfigForTestsAsync(config: IDbConfig): Promise<void>;
}

export default class ConfigService implements IConfigService {
  constructor(private events: IEvents) {
    this.checkFileConfigExistsAsyncAndEmitReady(); // TODO Should be called elsewhere
  }

  // TODO Check why this method get called twice on startup
  async checkFileConfigExistsAsync(): Promise<boolean> {
    try {
      const fd = await nfcall(
        fs.open,
        path.join(process.cwd(), 'config/default.json'),
        'r'
      );
      await nfcall(fs.close, fd);
      return true;
    } catch (err) { // Error means file doesn't exists
      return false;
    }
  }

  setDbConfigAsync(config: IDbConfig): Promise<void> {
    return this.setDbConfigWithConfigAsync(config, 'config/default.json');
  }

  setDbConfigForTestsAsync(config: IDbConfig): Promise<void> { // TODO Should be mocked, should be used for test
    return this.setDbConfigWithConfigAsync(config, 'config/unit-tests.json');
  }

  private async checkFileConfigExistsAsyncAndEmitReady(): Promise<void> {
    const exists = await this.checkFileConfigExistsAsync();
    if (exists) {
      this.events.emitConfigReady(require('config')); // TODO can we use something else than require?
    }
  }

  private async setDbConfigWithConfigAsync(config: IDbConfig, configPath: string): Promise<void> {
    await nfcall(
      fs.writeFile,
      path.join(process.cwd(), configPath),
      this.toJsonConfig(config)
    );

    this.events.emitConfigReady(require('config')); // TODO can we use something else than require?
  }

  private toJsonConfig(config: IDbConfig): string {
    return JSON.stringify({
      DbConnection: {
        host: config.host,
        port: config.port,
        dbName: config.dbName
      }
    });
  }
}
