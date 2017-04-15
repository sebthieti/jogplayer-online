import routes from '../routes';
import {IModel} from "./model";
import {UserState} from "../entities/userState";
import {UpdateUserStateRequest} from '../requests/updateUserState.request';
import {Link} from '../entities/link';
import {IUserModel} from './user.model';
import {IUserStateRepository} from '../repositories/userState.repository';

export interface IUserStateModel extends IModel<UserState> {
  playedPosition: number;
  mediaQueue: string[];
  browsingFolderPath: string;
  openedPlaylistId: string;
  playingMediumInQueueIndex: number;
  links: Link[];
  updateWith(updatedState: IUserStateModel): IUserStateModel;
  updateAsync(): Promise<IUserStateModel>;
  setFromRequest(request: UpdateUserStateRequest): IUserStateModel;
}

export class UserStateModel implements IUserStateModel {
  playedPosition: number;
  mediaQueue: string[];
  browsingFolderPath: string;
  openedPlaylistId: string;
  playingMediumInQueueIndex: number;

  constructor(
    private userStateRepository: IUserStateRepository,
    private user: IUserModel,
    entity?: UserState
  ) { // TODO Have attach method on user side?
    this.playedPosition = entity && entity.playedPosition || 0;
    this.playingMediumInQueueIndex = entity && entity.playingMediumInQueueIndex || 0;
    this.openedPlaylistId = entity && entity.openedPlaylistId || null;
    this.browsingFolderPath = entity && entity.browsingFolderPath || null;

    this.mediaQueue = entity && entity.mediaQueue || [];
  }

  setFromRequest(request: UpdateUserStateRequest): IUserStateModel {
    if ('playedPosition' in request)
      this.playedPosition = request.playedPosition;
    if ('browsingFolderPath' in request)
      this.browsingFolderPath = request.browsingFolderPath;
    if ('openedPlaylistId' in request)
      this.openedPlaylistId = request.openedPlaylistId;
    if ('playingMediumInQueueIndex' in request)
      this.playingMediumInQueueIndex = request.playingMediumInQueueIndex;
    if ('mediaQueue' in request) {
      this.mediaQueue = request.mediaQueue;
    }

    return this;
  }

  updateWith(state: IUserStateModel): IUserStateModel {
    Object.assign(this, state);
    return this;
  }

  async updateAsync(): Promise<IUserStateModel> {
    await this.userStateRepository.updateAsync(
      this.toEntity(),
      this.user._id
    );
    return this;
  }

  get links(): Link[] {
    return [{
      rel: 'self',
      href: routes.userStates.selfPath
    }, {
      rel: 'update',
      href: routes.userStates.updatePath
    }];
  }

  toEntity(): UserState {
    return {
      playedPosition: this.playedPosition,
      mediaQueue: this.mediaQueue,
      browsingFolderPath: this.browsingFolderPath,
      openedPlaylistId: this.openedPlaylistId,
      playingMediumInQueueIndex: this.playingMediumInQueueIndex
    };
  }
}
