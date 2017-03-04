import * as _ from 'lodash';
import {IUserModel, User} from '../models/user.model';
import {IRepository} from './repository';
import UserDto, {IUserDto} from '../dto/user.dto';
import {UserPermissions, IUserPermissionsModel} from '../models/userPermissions.model';

export interface IUserRepository {
  isRootUserSetAsync(): Promise<boolean>;
  getUsersAsync(): Promise<User[]>;
  getUserByIdWithPermissionsAsync(userId: string): Promise<User>;
  getUserByUsernameWithPermissionsAsync(username: string): Promise<User>;
  addRootUserAsync(
    userDto: IUserDto,
    userPermissionsModel: IUserPermissionsModel
  ): Promise<User>;
  addUserAsync(
    userDto: IUserDto,
    userPermissionsModel: IUserPermissionsModel,
    issuer: User
  ): Promise<User>;
  addUserPermissionsAsync(
    userId: string,
    permissionsArray: UserPermissions[],
    issuer: User
  ): Promise<UserPermissions[]>;
  updateFromUserDtoAsync (userId: string, userDto: UserDto, issuer: User): Promise<User>;
  removeUserByIdAsync (userId: string, issuer: User): Promise<void>;
}

export default class UserRepository implements IUserRepository {
  private User: IUserModel;

  constructor(private saveService: IRepository, userModel: IUserModel) {
    this.User = userModel;
  }

  async isRootUserSetAsync(): Promise<boolean> {
    const allUsers = await <Promise<User[]>>this.User
      .find({})
      .populate('permissions')
      .exec();

    return _.some(allUsers
      .map(user => user.permissions)
      .filter(permissions => permissions.isRoot === true)
    );
  }

  async getUsersAsync(): Promise<User[]> { // TODO getUsersWithPermissionsAsync
    return await this.User
      .find({})
      .populate('permissions')
      .exec();
  }

  async getUserByIdWithPermissionsAsync(userId: string): Promise<User> {
    return await this.User
      .findOne({ _id: userId})
      .populate('permissions')
      .exec();
  }

  async getUserByUsernameWithPermissionsAsync(username: string): Promise<User> {
    return await this.User
      .findOne({ username: username})
      .populate('permissions')
      .exec();
  }

  async addRootUserAsync(
    userDto: IUserDto,
    userPermissionsModel: UserPermissions
  ): Promise<User> {
    if (!userDto) {
      throw new Error('SetupSaveService.addUserAsync: favorite must be set');
    }
    if (userDto.id) {
      throw new Error('SetupSaveService.addUserAsync: user.Id should not be set');
    }

    // delete userDto.permissions;
    userDto.permissions = null;
    // var userFields = userDto.getDefinedFields();

    let newUser = await <Promise<User>>this.User.create(userDto);
    newUser.permissions = userPermissionsModel;
    return await newUser.save();
  }

  async addUserAsync(
    userDto: IUserDto,
    userPermissions: UserPermissions,
    issuer: User
  ): Promise<User> {
    if (!userDto) {
      throw new Error('SetupSaveService.addUserAsync: favorite must be set');
    }
    if (!issuer) {
      throw new Error('SetupSaveService.addUserAsync: issuer must be set');
    }
    if (userDto.id) {
      throw new Error('SetupSaveService.addUserAsync: user.Id should not be set');
    }

    //delete userDto.permissions;
    userDto.permissions = null;
    const userFields = userDto.getDefinedFields();

    let newUser = await this.User.create(userFields);

    newUser.permissions = userPermissions;
    return await newUser.save();
  }

  async addUserPermissionsAsync(
    userId: string,
    permissionsArray: UserPermissions[],
    issuer: User
  ): Promise<UserPermissions[]> {
    let user = await this.User
      .findOne({_id: userId}) // , ownerId: issuer.id
      .populate({path: 'permissions', select: '_id'})
      .exec();

    user.permissions = user.permissions.concat(permissionsArray);
    await user.save();

    return permissionsArray;
  }

  async updateFromUserDtoAsync(userId: string, userDto: UserDto, issuer: User): Promise<User> {
    if (!userDto) {
      throw new Error('SetupSaveService.updateFromUserDtoAsync: user must be set');
    }
    if (!userId) {
      throw new Error('SetupSaveService.updateFromUserDtoAsync: user.Id should be set');
    }

    return await this.User.findOneAndUpdate(
      { _id: userId }, // , ownerId: issuer.id
      userDto.getDefinedFields(),
      { 'new': true }
    ); // Return modified doc.
  }

  async removeUserByIdAsync(userId: string, issuer: User): Promise<void> {
    if (!userId) {
      throw new Error('SetupSaveService.removeUserByIdAsync: userId must be set');
    }

    await this.User.findOneAndRemove({ _id: userId });
  }
}
