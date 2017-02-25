import {IUserStateModel} from '../models/userState.model';

export interface IUserStateRepository {
  getUserStateAsync(ownerId);
  addUserStateAsync(userId, state);
  updateFromUserStateDtoAsync(userStateId, ownerId, userStateDto);
  removeUserStateByIdAsync(userId);
}

export default class UserStateRepository implements IUserStateRepository {
  private UserState: IUserStateModel;

  constructor(userState: IUserStateModel) {
    this.UserState = userState;
  }

  getUserStateAsync(ownerId) {
    return new Promise((resolve, reject) => {
      this.UserState
        .findOne({ ownerId: ownerId})
        .exec((err, user) => {
          if (err) {
            reject(err);
          } else {
            resolve(user);
          }
        });
    });
  }

  addUserStateAsync(userId, state) {
    return new Promise((resolve, reject) => {
      if (!userId) {
        reject('SetupSaveService.addUserStateAsync: userId must be set');
      }
      if (!state) {
        reject('SetupSaveService.addUserStateAsync: state must be set');
      }

      this.UserState.create({
        ownerId: userId,
        playedPosition: state.playedPosition,
        volume: state.volume,
        mediaQueue: state.mediaQueue,
        browsingFolderPath: state.browsingFolderPath,
        openedPlaylistId: state.openedPlaylistId,
        playingMediumInQueueIndex: state.playingMediumInQueueIndex
      }, (err, newUserState) => {
        if (err) {
          reject(err);
        } else {
          resolve(newUserState);
        }
      });
    });
  }

  updateFromUserStateDtoAsync(userStateId, ownerId, userStateDto) {
    return new Promise((resolve, reject) => {
      if (!ownerId) {
        reject('SetupSaveService.updateFromUserStateDtoAsync: ownerId must be set');
      }
      if (!userStateDto) {
        reject('SetupSaveService.updateFromUserStateDtoAsync: userStateDto must be set');
      }

      this.UserState.findOneAndUpdate(
        { _id: userStateId, ownerId: ownerId },
        userStateDto.getDefinedFields(),
        { 'new': true }, // Return modified doc.
        (err, userState) => {
          if (err) {
            reject(err);
          } else {
            resolve(userState);
          }
        }
      );
    });
  }

  removeUserStateByIdAsync(userId) {
    return new Promise((resolve, reject) => {
      if (!userId) {
        reject('SetupSaveService.removeUserStateByIdAsync: userId must be set');
      }

      this.UserState.findOneAndRemove(
        { ownerId: userId },
        err => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        }
      );
    });
  }
}
