import {IUserModel, User} from '../models/user.model';
import {IUserDto} from '../dto/user.dto';

export interface IConfigRepository {
  addRootUserAsync(user: IUserDto): Promise<User>;
}

export default class ConfigRepository implements IConfigRepository {
  private User: IUserModel;

  constructor(userModel: IUserModel) {
    this.User = userModel;
  }

  async addRootUserAsync(user: IUserDto): Promise<User> {
    const newUser = await this.User.create({
      isActive: true,
      username: '',
      password: '',
      passwordSalt: '',
      fullName: '',
      email: ''
    });
    // TODO Probably incomment this once repo finalized
    // newUser.permissions = userPermissionsModel;
    return await newUser.save();
  }
}
