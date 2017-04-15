import {IUserDirector} from './user.director';

export interface IConfigDirector {
  isDbInitializedAsync(): Promise<boolean>;
}

export default class ConfigDirector implements IConfigDirector {
  constructor(private userDirector: IUserDirector) {}

  isDbInitializedAsync(): Promise<boolean> {
    return this.isRootUserFileConfigExistsAsync();
  }

  private isRootUserFileConfigExistsAsync(): Promise<boolean> {
    return this.userDirector.isRootUserSetAsync();
  }
}
