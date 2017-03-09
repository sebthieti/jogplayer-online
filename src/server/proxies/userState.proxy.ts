import {ICache} from './cache';
import {IUserStateRepository} from '../repositories/userState.repository';
import {UserState} from '../models/userState.model';
import {IUserStateDto} from '../dto/userState.dto';

export interface IUserStateProxy {
  getUserStateAsync(userId: string): Promise<UserState>;
  addUserStateAsync(issuerId, userStateDto);
  updateFromUserStateDtoAsync(
    userStateId: string,
    issuerId: string,
    userStateDto: IUserStateDto
  ): Promise<UserState>;
  removeUserStateByIdAsync(userId);
}

export default class UserStateProxy implements IUserStateProxy {
  private USER_STATE = 'user.state';

  constructor(
    private cache: ICache,
    private userStateSaveService: IUserStateRepository
  ) {
  }

  async getUserStateAsync(userId: string): Promise<UserState> {
    const userState = this.cache.getItemFromCache<UserState>(
      this.USER_STATE,
      userId
    );
    if (userState != null) {
      return userState;
    } else {
      const userState = await this.userStateSaveService
        .getUserStateAsync(userId);

      this.cache.createOrUpdateItem(
        this.USER_STATE,
        userId,
        userState
      );
      return userState;
    }
  }

  async addUserStateAsync(issuerId: string, userStateDto: IUserStateDto): Promise<UserState> {
    const userState = await this.userStateSaveService
      .addUserStateAsync(issuerId, userStateDto);

    this.cache.createOrUpdateItem(
      this.USER_STATE,
      issuerId,
      userState
    );
    return userState;
  }

  async updateFromUserStateDtoAsync(
    userStateId: string,
    issuerId: string,
    userStateDto: IUserStateDto
  ): Promise<UserState> {
    const userState = await this.userStateSaveService
      .updateFromUserStateDtoAsync(userStateId, issuerId, userStateDto);

    this.cache.createOrUpdateItem(
      this.USER_STATE,
      issuerId,
      userState
    );
    return userState;
  }

  async removeUserStateByIdAsync(userId: string): Promise<void> {
    await this.userStateSaveService.removeUserStateByIdAsync(userId);
    this.cache.removeItem(this.USER_STATE, userId);
  }
}
