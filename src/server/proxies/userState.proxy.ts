import {ICache} from './cache';
import {IUserStateRepository} from '../repositories/userState.repository';

export interface IUserStateProxy {
  getUserStateAsync(userId);
  addUserStateAsync(issuerId, userStateDto);
  updateFromUserStateDtoAsync(userStateId, issuerId, userStateDto);
  removeUserStateByIdAsync(userId);
}

export default class UserStateProxy implements IUserStateProxy {
  private USER_STATE = 'user.state';

  constructor(
    private cache: ICache,
    private userStateSaveService: IUserStateRepository
  ) {
  }

  getUserStateAsync(userId) {
    const userState = this.cache.getItemFromCache(
      this.USER_STATE,
      userId
    );
    if (userState != null) {
      return Promise.resolve(userState);
    } else {
      return this.userStateSaveService
        .getUserStateAsync(userId)
        .then(userState => {
          this.cache.createOrUpdateItem(
            this.USER_STATE,
            userId,
            userState
          );
          return userState;
        });
    }
  }

  addUserStateAsync(issuerId, userStateDto) {
    return this.userStateSaveService
      .addUserStateAsync(issuerId, userStateDto)
      .then(userState => {
        this.cache.createOrUpdateItem(
          this.USER_STATE,
          issuerId,
          userState
        );
        return userState;
      });
  }

  updateFromUserStateDtoAsync(userStateId, issuerId, userStateDto) {
    return this.userStateSaveService
      .updateFromUserStateDtoAsync(userStateId, issuerId, userStateDto)
      .then(userState => {
        this.cache.createOrUpdateItem(
          this.USER_STATE,
          issuerId,
          userState
        );
        return userState;
      });
  }

  removeUserStateByIdAsync(userId) {
    return this.userStateSaveService
      .removeUserStateByIdAsync(userId)
      .then(() => {
        this.cache.removeItem(this.USER_STATE, userId);
      });
  }
}
