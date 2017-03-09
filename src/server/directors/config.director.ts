import {IUserDirector} from './user.director';
import {IConfigService} from '../services/config.service';
import {IEvents} from '../events/index';
import {IUserDto} from '../dto/user.dto';

export interface IConfigDirector {
  setRootUserAsync(rootUserDto: IUserDto): Promise<IUserDto>;
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

  setRootUserAsync(rootUserDto: IUserDto): Promise<IUserDto> {
    return this.userDirector
      .addRootUserAsync({
        username: rootUserDto.username,
        password: rootUserDto.password
      });
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
