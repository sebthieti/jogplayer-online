import {IUserDirector} from './user.director';
import {IConfigService} from '../services/config.service';
import {IEvents} from '../events/index';

export interface IConfigDirector {
  setRootUserAsync(rootUserDto);
  isDbInitializedAsync();
}

export default class ConfigDirector implements IConfigDirector {
  constructor(
    private events: IEvents,
    private userDirector: IUserDirector,
    private configService: IConfigService
  ) {
    this.checkFileConfigExistsAsync();
  }

  setRootUserAsync(rootUserDto) {
    return this.userDirector
      .addRootUserAsync({
        username: rootUserDto.username,
        password: rootUserDto.password
      });
  }

  isDbInitializedAsync() {
    return this.isRootUserFileConfigExistsAsync();
  }

  private checkFileConfigExistsAsync() {
    return this.configService
      .checkFileConfigExistsAsync()
      .then(exists => {
        this.events.emitConfigFileIsValid(exists);
      });
  }

  private isRootUserFileConfigExistsAsync() {
    return this.userDirector.isRootUserSetAsync();
  }
}
