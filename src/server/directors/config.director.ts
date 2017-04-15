import {IUserDirector} from './user.director';
import {IConfigService} from '../services/config.service';
import {IEvents} from '../events/index';

export interface IConfigDirector {
  isDbInitializedAsync(): Promise<boolean>;
}

export default class ConfigDirector implements IConfigDirector {
  constructor(
    private events: IEvents,
    private userDirector: IUserDirector,
    private configService: IConfigService
  ) {
    this.checkFileConfigExistsAsync();
  }

  isDbInitializedAsync(): Promise<boolean> {
    return this.isRootUserFileConfigExistsAsync();
  }

  private isRootUserFileConfigExistsAsync(): Promise<boolean> {
    return this.userDirector.isRootUserSetAsync();
  }

  private async checkFileConfigExistsAsync() {
    const exists = await this.configService.checkFileConfigExistsAsync();
    this.events.emitConfigFileIsValid(exists);
  }
}
