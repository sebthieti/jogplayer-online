import {autoinject} from 'aurelia-framework';
import {UserRepository} from '../repositories/user.repository';
import UserModel from '../models/user.model';
import UserPermissionsModel from '../models/userPermissions.model';

@autoinject
export default class UserService {
  constructor(private repository: UserRepository) {
  }

  async getUsers(): Promise<UserModel[]> {
    const users = await this.repository.getUsers();
    return users.map(user => new UserModel(this, user));
  }

  async makeUser(): Promise<UserModel> {
    return new UserModel(this);
  }

  async addUser(model: UserModel, password: string): Promise<UserModel> {
    const user = await this.repository.insert(model.toInsertUserRequest(password));
    model.setFromEntity(user);
    return model;
  }

  async changePassword(model: UserModel, newPassword: string): Promise<UserModel> {
    const updatedUser = await this.repository.update(model.id, {
      password: newPassword
    });
    model.setFromEntity(updatedUser);

    return model;
  }

  async update(model: UserModel): Promise<UserModel> {
    const updatedUser = await this.repository.update(
      model.id,
      model.toUpsertRequest()
    );
    model.setFromEntity(updatedUser);

    return model;
  }

  async updatePermissions(model: UserPermissionsModel): Promise<UserPermissionsModel> {
    const updatedPermissions = await this.repository.updatePermissions(
      model.user.id,
      model.toUpdateRequest()
    );
    model.setFromEntity(updatedPermissions);

    return model;
  }

  async removeUser(user: UserModel): Promise<void> {
    await this.repository.remove(user.id);
  }
}
