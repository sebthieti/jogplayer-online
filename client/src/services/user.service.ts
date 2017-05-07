import {autoinject} from 'aurelia-framework';
import {UserRepository} from '../repositories/user.repository';
import UserModel from '../models/user.model';

@autoinject
export default class UserService {
  constructor(private userRepository: UserRepository) {
  }

  async getUsers(): Promise<UserModel[]> {
    const users = await this.userRepository.getUsers();
    return users.map(user => new UserModel(this.userRepository, user));
  }

  async makeUser(): Promise<UserModel> {
    return new UserModel(this.userRepository);
  }

  async addUser(model: UserModel, password: string): Promise<UserModel> {
    const user = await this.userRepository.insert(model.toInsertUserRequest(password));
    model.setFromEntity(user);
    return model;
  }

  async removeUser(user: UserModel): Promise<void> {
    await this.userRepository.remove(user.id);
  }
}
