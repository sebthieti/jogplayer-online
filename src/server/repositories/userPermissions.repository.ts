import {IUserPermissionsModel, UserPermissions} from '../models/userPermissions.model';
import {User} from '../models/user.model';
import {IUserDto} from '../dto/user.dto';
import {IUserPermissionsDto} from '../dto/userPermissions.dto';

export interface IUserPermissionsRepository {
  getAllUserPermissionsAsync(): Promise<UserPermissions[]>;
  getUserPermissionsAsync(userId: string): Promise<UserPermissions>;
  addUserPermissionsAsync(userPermissions: IUserPermissionsDto): Promise<UserPermissions>;
  updateFromUserDtoAsync(userId: string, userDto: IUserDto, issuer: User): Promise<UserPermissions>;
  removeUserByIdAsync(userId: string, issuer: User): Promise<void>;
}

export default class UserPermissionsRepository implements IUserPermissionsRepository {
  private UserPermissions: IUserPermissionsModel;

  constructor(userPermissionsModel: IUserPermissionsModel) {
    this.UserPermissions = userPermissionsModel;
  }

  async getAllUserPermissionsAsync(): Promise<UserPermissions[]> {
    return await this.UserPermissions
      .find({})
      .exec();
  }

  async getUserPermissionsAsync(userId: string): Promise<UserPermissions> { // TODO getUsersWithPermissionsAsync
    return await this.UserPermissions
      .find({ userId: userId })
      .exec();
  }

  async addUserPermissionsAsync(userPermissions: IUserPermissionsDto): Promise<UserPermissions> {
    if (!userPermissions) {
      throw new Error('UserPermissionsSaveService.addUserPermissionsAsync: userPermissions must be set');
    }

    const userPermissionsFields = userPermissions.getDefinedFields();

    return await this.UserPermissions.create(userPermissionsFields);
  }

  async updateFromUserDtoAsync(userId: string, userDto: IUserDto, issuer: User): Promise<UserPermissions> {
    if (!userDto) {
      throw new Error('SetupSaveService.updateFromUserDtoAsync: user must be set');
    }
    if (!userId) {
      throw new Error('SetupSaveService.updateFromUserDtoAsync: user.Id should be set');
    }

    return await this.UserPermissions.findOneAndUpdate(
      { _id: userId }, // , ownerId: issuer.id
      userDto.getDefinedFields(),
      { 'new': true }
    ); // Return modified doc.
  };

  async removeUserByIdAsync(userId: string, issuer: User): Promise<void> {
    if (!userId) {
      throw new Error('SetupSaveService.removeUserByIdAsync: userId must be set');
    }

    await this.UserPermissions.findOneAndRemove({_id: userId});
  }
}
